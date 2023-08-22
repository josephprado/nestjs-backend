import { Request } from 'express';

/**
 * An HTTP request with user information.
 */
export class AuthRequest extends Request {
  user: {
    sub: string;
    username: string;
  };
}
