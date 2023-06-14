import bcrypt from "bcryptjs";
import { NextFunction, Request, Response } from "express";

import { forwardCustomError } from "@/middlewares";
import { AdminUser, User } from "@/models";
import { ApiResults, StatusCode } from "@/types";
import { filteredUndefinedConditions, getJwtToken, sendSuccessResponse, timeHandler } from "@/utils";
import mongoDbHandler from "@/utils/mongoDbHandler";

const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  const { username, email, plan, startDate, endDate } = req.body;
  const queryConditions = filteredUndefinedConditions({ username, email, plan });

  // 如果沒有任何條件，就回傳空陣列
  if (Object.keys(req.body).length === 0) {
    sendSuccessResponse(res, ApiResults.SUCCESS_GET_DATA, { users: [] });
    return;
  }

  // 搜尋註冊時間區間
  if (startDate && endDate) {
    const { isValidDateTime } = timeHandler;

    if (!isValidDateTime(startDate) || !isValidDateTime(endDate)) {
      forwardCustomError(next, StatusCode.BAD_REQUEST, ApiResults.FAIL_TO_GET_DATA, {
        error: "Invalid date format.",
      });
      return;
    }

    queryConditions.createdAt = {
      $gte: startDate,
      $lte: endDate,
    };
  }

  const targetUsers = await User.find(queryConditions).select("_id username email isArchived createdAt");

  if (!targetUsers || targetUsers.length === 0) {
    // 回傳空陣列，代表沒有符合此條件下的 user
    sendSuccessResponse(res, ApiResults.SUCCESS_GET_DATA, { users: [] });
  } else {
    sendSuccessResponse(res, ApiResults.SUCCESS_GET_DATA, { users: targetUsers });
  }
};

const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  // 前端點擊 user 的時候，將 user id 帶入 url query
  const { id } = req.params;
  const targetUser = await User.findOne({ _id: id });

  if (!targetUser) {
    forwardCustomError(next, StatusCode.BAD_REQUEST, ApiResults.FAIL_TO_GET_DATA, {
      field: "user",
      error: "User Id not found.",
    });
  } else {
    sendSuccessResponse(res, ApiResults.SUCCESS_GET_DATA, {
      user: targetUser,
    });
  }
};

const updateUserById = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const { username, plan, isArchived } = req.body;
  const targetUser = await User.findById(id);

  if (!targetUser) {
    forwardCustomError(next, StatusCode.BAD_REQUEST, ApiResults.FAIL_TO_GET_DATA, {
      field: "user",
      error: "User Id not found.",
    });
  } else {
    const updateData = { username, plan, isArchived };
    mongoDbHandler.updateDb(res, next, "User", User, { _id: id }, updateData, {});
  }
};

// 可使用 postman 建立帳號，不會有前端註冊帳號畫面
const register = async (req: Request, res: Response, next: NextFunction) => {
  const { username, password } = req.body;

  // 檢查參數不為空
  if (!username || !password) {
    let errorColumn = "";
    if (!username && !password) {
      errorColumn = "username and password";
    } else if (!username) {
      errorColumn = "username";
    } else if (!password) {
      errorColumn = "password";
    }

    forwardCustomError(next, StatusCode.BAD_REQUEST, ApiResults.FAIL_CREATE, {
      field: errorColumn,
      error: `Please enter ${errorColumn}`,
    });
  }

  // 後臺註冊只需要 username 和 password，所以只要 username 無重複即可
  const hasExistingUsername = await AdminUser.findOne({ username });
  if (hasExistingUsername) {
    forwardCustomError(next, StatusCode.BAD_REQUEST, ApiResults.FAIL_CREATE, {
      field: "username",
      error: "The username is existing!",
    });
  }

  const securedPassword = await bcrypt.hash(password, 12);
  const newUser = await AdminUser.create({
    username,
    password: securedPassword,
    lastActiveTime: Date.now(),
  });
  const token = getJwtToken(newUser.id!);
  sendSuccessResponse(res, ApiResults.SUCCESS_CREATE, {
    token,
    username: newUser.username,
  });
};

const login = async (req: Request, res: Response, next: NextFunction) => {
  const { username, password } = req.body;

  // 只做簡單的不為空檢查
  if (!username || !password) {
    let errorColumn = "";
    if (!username && !password) {
      errorColumn = "username and password";
    } else if (!username) {
      errorColumn = "username";
    } else if (!password) {
      errorColumn = "password";
    }

    forwardCustomError(next, StatusCode.BAD_REQUEST, ApiResults.FAIL_LOG_IN, {
      field: errorColumn,
      error: `Please enter ${errorColumn}`,
    });
  }

  const targetUser = await AdminUser.findOne({ username }).select("+password");
  const comparePasswordResult = await bcrypt.compare(password, targetUser?.password || "");

  if (!targetUser) {
    forwardCustomError(next, StatusCode.UNAUTHORIZED, ApiResults.FAIL_LOG_IN, {
      error: ApiResults.UNAUTHORIZED_IDENTITY,
    });
    return;
  }

  if (!comparePasswordResult) {
    forwardCustomError(next, StatusCode.UNAUTHORIZED, ApiResults.FAIL_LOG_IN, {
      field: "password",
      error: ApiResults.MIS_MATCH_PASSWORD,
    });
    return;
  }

  const token = getJwtToken(targetUser.id);
  sendSuccessResponse(res, ApiResults.SUCCESS_LOG_IN, {
    token,
    user: {
      id: targetUser.id,
      username: targetUser.username,
      createdAt: targetUser.createdAt,
      updatedAt: targetUser.updatedAt,
    },
  });
};

export default {
  getUsers,
  getUserById,
  updateUserById,
  register,
  login,
};