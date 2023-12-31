import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { LogService } from 'src/log/log.service';
import { SessionService } from '../service/session.service';

/**
 * Route handlers using this guard require a valid "session_id" cookie.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly LOGGER: LogService,
    private readonly SES_SVC: SessionService
  ) {
    // FIXME: logs are using controller context for some reason
    this.LOGGER.setContext(SessionGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const sessionId = request.cookies?.session_id;

    if (!sessionId) {
      const message = 'Malformed session id.';
      this.LOGGER.error(message);
      throw new UnauthorizedException(message);
    }

    const session = await this.SES_SVC.findOneById(sessionId);

    if (session) {
      await this.SES_SVC.extendExpireDate(sessionId);

      const { id, username } = session.createUser;
      request.user = { sub: id, username };

      this.LOGGER.log(`Authorized session id ${sessionId}.`);
    } else {
      const message = 'Invalid session id.';
      this.LOGGER.error(message);
      throw new UnauthorizedException(message);
    }
    return true;
  }
}
