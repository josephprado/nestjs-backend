import { Request } from 'express';

export class AuthRequest extends Request {
  user: {
    id: string;
    username: string;
  };
}
