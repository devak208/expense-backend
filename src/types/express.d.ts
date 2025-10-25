import { User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      auth: () => {
        userId: string;
        sessionId: string;
        [key: string]: any;
      } | null;
      user?: User;
    }
  }
}

export {};
