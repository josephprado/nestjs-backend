import { Request } from 'express';

export class AuthRequest extends Request {
  user: {
    sub: string;
    username: string;
  };
}
