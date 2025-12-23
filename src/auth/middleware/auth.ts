//auth/middleware/auth.ts

import { Request, Response, NextFunction } from "express";

export function auth(req: Request, res: Response, next: NextFunction) {
  const session = req.cookies.session_id;
  console.log(session);

  if (!session) {
    console.log(true);
    return res.status(401).json({ success: false, message: "No autorizado" });
  }

  next();
}
