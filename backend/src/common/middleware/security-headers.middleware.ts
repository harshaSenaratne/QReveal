import type { NextFunction, Request, RequestHandler, Response } from "express";

export const securityHeaders: RequestHandler = (
  _request: Request,
  response: Response,
  next: NextFunction,
) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "no-referrer");
  next();
};
