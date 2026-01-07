import { Request, Response, NextFunction } from "express";
import { getAuth } from "firebase-admin/auth";

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).send("Missing auth token");
  }

  const token = header.split("Bearer ")[1];

  try {
    const decodedToken = await getAuth().verifyIdToken(token);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };

    next();
  } catch (error) {
    return res.status(401).send("Invalid auth token");
  }
};
