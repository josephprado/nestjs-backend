import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LogService } from 'src/log/log.service';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

/**
 * Route handlers using this guard require a valid JSON Web Token (JWT).
 */
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly CONFIG: ConfigService,
    private readonly LOGGER: LogService,
    private readonly JWT_SVC: JwtService
  ) {
    // FIXME: logs are using controller context for some reason
    this.LOGGER.setContext(AccessTokenGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      const message = 'Malformed token.';
      this.LOGGER.error(message);
      throw new UnauthorizedException(message);
    }

    try {
      const payload = await this.JWT_SVC.verifyAsync(token, {
        secret: this.CONFIG.get('JWT_ACCESS_SECRET')
      });
      request.user = payload;
      payload.sub && this.LOGGER.log(`Authorized user with id ${payload.sub}.`);
    } catch {
      const message = 'Invalid token.';
      this.LOGGER.error(message);
      throw new UnauthorizedException(message);
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
