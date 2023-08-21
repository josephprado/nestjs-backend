import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { LogService } from 'src/log/log.service';
import { SessionService } from '../service/session.service';

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
    const sessionId = request.cookies?.get('session_id');

    if (!sessionId) {
      this.LOGGER.error('Malformed session id.');
      throw new UnauthorizedException();
    }

    const session = await this.SES_SVC.findOneById(sessionId);

    if (session) {
      await this.SES_SVC.extendExpireDate(sessionId);

      const { id, username } = session.createUser;
      request.user = { id, username };

      this.LOGGER.log(`Authorized session id ${sessionId}.`);
    } else {
      this.LOGGER.error('Invalid session id.');
      throw new UnauthorizedException();
    }
    return true;
  }
}
