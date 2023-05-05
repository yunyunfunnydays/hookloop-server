import { NextFunction, Request, Response } from "express";

import { CustomError } from "@/classes";
import { ApiResults, ApiStatus, DataType, StatusCode } from "@/types";
import { sendErrorResponse } from "@/utils";

// INFO: 使用 asyncWrapper 包裹 async 函数，可以避免每個 async 函数都寫 try catch
// const asyncWrapper = (fn) => {
//   return  (req, res, nex) => {
//     try {
//       await fn(req, res, next);
//     } catch (err) {
//       next(err);
//     }
//   };
// };
export const asyncWrapper = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  console.log("asyncWrapper");
  return (req: Request, res: Response, next: NextFunction) => {
    console.log("fn");
    fn(req, res, next).catch((err: Error) => next(err));
  };
};

// INFO: 包裝成 customError 並 next(err) 送至 errorHandler
export const forwardCustomError = (
  next: NextFunction,
  statusCode: StatusCode,
  message: ApiResults,
  data: DataType = {},
) => {
  const err = new CustomError(statusCode, message, data);
  console.log("forwardCustomError");
  next(err);
};

// INFO: Error handler middleware
// DISCUSS:要做開發環境的response嗎? 可以查看error stack
// HELP: next 不傳入參數的寫法無效
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: CustomError | any, req: Request, res: Response, _next: NextFunction) => {
  console.log("errorHandler");
  if (err instanceof CustomError) {
    console.log("CustomError");
    sendErrorResponse(err, res);
  } else {
    // Handle other errors
    console.log("CatchError");
    let customError: CustomError;
    if (err.code === 11000) {
      console.log("err.code === 11000");
      customError = new CustomError(StatusCode.INTERNAL_SERVER_ERROR, ApiResults.FAIL_CREATE, {}, ApiStatus.ERROR);
    } else {
      console.log("other error");
      console.error(err);
      console.error(err.name);
      customError = new CustomError(StatusCode.INTERNAL_SERVER_ERROR, ApiResults.UNEXPECTED_ERROR, {}, ApiStatus.ERROR);
    }
    sendErrorResponse(customError, res);
  }
};