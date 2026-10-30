import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const getJwtSecret = () => process.env.JWT_SECRET || "vidcraft-dev-secret-change-me";

export const signToken = (user) =>
  jwt.sign(
    { sub: user._id.toString(), email: user.email },
    getJwtSecret(),
    { expiresIn: "7d" }
  );

export const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: "Sign in required." });
    }

    const payload = jwt.verify(token, getJwtSecret());
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: "Account not found." });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired session. Please sign in again." });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      req.user = null;
      return next();
    }
    const payload = jwt.verify(token, getJwtSecret());
    req.user = await User.findById(payload.sub);
    next();
  } catch {
    req.user = null;
    next();
  }
};
