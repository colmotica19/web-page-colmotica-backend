import { Request, Response, NextFunction } from "express";

export function auth(req: Request, res: Response, next: NextFunction) {
  const session = req.cookies.session_id;

  if (!session) {
    return res.status(401).json({ success: false, message: "No autorizado" });
  }

  next();
}
