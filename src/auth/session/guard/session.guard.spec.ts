import { Test, TestingModule } from '@nestjs/testing';
import { LogService } from 'src/log/log.service';
import { SessionGuard } from './session.guard';
import { SessionService } from '../service/session.service';
import { Session } from '../entity/session.entity';
import { User } from 'src/auth/user/entity/user.entity';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';

describe(SessionGuard.name, () => {
  let guard: SessionGuard;
  let sesSvc: SessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogService,
        SessionGuard,
        {
          provide: SessionService,
          useValue: {
            findOneById: jest.fn(),
            extendExpireDate: jest.fn()
          }
        }
      ]
    }).compile();

    guard = module.get<SessionGuard>(SessionGuard);
    sesSvc = module.get<SessionService>(SessionService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe(SessionGuard.prototype.canActivate.name, () => {
    let context: ExecutionContext;
    let request: any;
    let session: Session;
    let user: User;

    beforeEach(() => {
      user = {
        id: randomUUID(),
        username: 'username',
        email: 'username@email.com',
        createDate: new Date(),
        updateDate: new Date()
      };
      session = new Session();
      session.createUser = user;

      request = {
        cookies: {
          get: () => session.id
        }
      };
      context = {
        switchToHttp: () => ({
          getRequest: () => request
        })
      } as ExecutionContext;
    });

    it('should return true if session id is valid', async () => {
      session.id = randomUUID();
      jest
        .spyOn(sesSvc, 'findOneById')
        .mockImplementation(async (x) => (x === session.id ? session : null));

      const result = await guard.canActivate(context);
      expect(result).toEqual(true);
    });

    it('should throw UnauthorizedException if no session id cookie', async () => {
      session.id = undefined;
      expect(async () => await guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException if session id is invalid', async () => {
      session.id = randomUUID();
      jest
        .spyOn(sesSvc, 'findOneById')
        .mockImplementation(async (x) => (x === session.id ? null : session));

      expect(async () => await guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should extend the session expire date', async () => {
      session.id = randomUUID();
      jest
        .spyOn(sesSvc, 'findOneById')
        .mockImplementation(async (x) => (x === session.id ? session : null));

      await guard.canActivate(context);
      expect(sesSvc.extendExpireDate).toHaveBeenCalledWith(session.id);
    });

    it('should add the user id (sub) and username to the request object', async () => {
      session.id = randomUUID();
      jest
        .spyOn(sesSvc, 'findOneById')
        .mockImplementation(async (x) => (x === session.id ? session : null));

      await guard.canActivate(context);
      expect(request['user']).toEqual(
        expect.objectContaining({ sub: user.id, username: user.username })
      );
    });
  });
});
