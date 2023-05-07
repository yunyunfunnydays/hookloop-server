import { Response } from "express";

import HOOKLOOP_TOKEN from "@/const";

const setCookie = (res: Response, token: string) => {
  res.cookie(HOOKLOOP_TOKEN, token, {
    expires: new Date(Date.now() + 10 * 60), // 10 min for testing
    httpOnly: true,
    secure: true,
  });
};

export default setCookie;
