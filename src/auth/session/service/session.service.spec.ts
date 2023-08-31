import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SessionService } from './session.service';
import { Session } from '../entity/session.entity';
import { User } from 'src/auth/user/entity/user.entity';
import { randomUUID } from 'crypto';

describe(SessionService.name, () => {
  let svc: SessionService;
  let repo: Repository<Session>;
  let user: User;
  let session: Session;
  let config: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              switch (key) {
                case 'SESSION_EXPIRE':
                  return '15m';
              }
            })
          }
        },
        SessionService,
        {
          provide: getRepositoryToken(Session),
          useValue: {
            save: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
          }
        }
      ]
    }).compile();

    svc = module.get<SessionService>(SessionService);
    repo = module.get<Repository<Session>>(getRepositoryToken(Session));
    config = module.get<ConfigService>(ConfigService);
    user = {
      id: randomUUID(),
      username: 'username',
      email: 'username@email.com',
      createDate: new Date(),
      updateDate: new Date()
    };
    session = {
      id: randomUUID(),
      createUser: user,
      updateUser: user,
      expireDate: expect.any(Date),
      createDate: new Date(),
      updateDate: new Date()
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe(SessionService.prototype.create.name, () => {
    it('should attach the given user to the session', async () => {
      await svc.create(user);
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ createUser: user })
      );
    });

    it.each([
      ['0s', new Date(0)],
      ['60s', new Date(1000 * 60)],
      ['0m', new Date(0)],
      ['60m', new Date(1000 * 60 * 60)],
      ['0h', new Date(0)],
      ['24h', new Date(1000 * 60 * 60 * 24)],
      ['0d', new Date(0)],
      ['7d', new Date(1000 * 60 * 60 * 24 * 7)],
      ['0w', new Date(0)],
      ['52w', new Date(1000 * 60 * 60 * 24 * 7 * 52)]
    ])(
      'should use the expected expire date',
      async (expire: string, expireDate: Date) => {
        jest.spyOn(config, 'get').mockReturnValue(expire);
        jest.spyOn(global.Date, 'now').mockReturnValue(0);

        await svc.create(user);
        expect(repo.save).toHaveBeenCalledWith(
          expect.objectContaining({ expireDate })
        );
      }
    );

    it('should return the created session', async () => {
      jest
        .spyOn(repo, 'save')
        .mockImplementation(async (x) =>
          x.createUser.id === user.id ? session : null
        );

      const actual = await svc.create(user);
      expect(actual).toEqual(expect.objectContaining(session));
    });
  });

  describe(SessionService.prototype.findOneById.name, () => {
    beforeEach(() => {
      jest
        .spyOn(repo, 'findOne')
        .mockImplementation(async (options) =>
          options.where['id'] === session.id ? session : null
        );
    });

    it('should return the expected session', async () => {
      const actual = await svc.findOneById(session.id);
      expect(actual).toEqual(session);
    });

    it('should return null if the session does not exist', async () => {
      let sessionId: string;
      while (!sessionId || sessionId === session.id) sessionId = randomUUID();

      const actual = await svc.findOneById(sessionId);
      expect(actual).toBeNull();
    });
  });

  describe(SessionService.prototype.extendExpireDate.name, () => {
    it.each([[0], [1], [2]])(
      'should return the number of affected rows',
      async (affected: number) => {
        jest
          .spyOn(repo, 'update')
          .mockResolvedValue({ affected } as UpdateResult);

        const actual = await svc.extendExpireDate(session.id);
        expect(actual).toEqual(affected);
      }
    );

    it.each([
      ['0s', new Date(0)],
      ['60s', new Date(1000 * 60)],
      ['0m', new Date(0)],
      ['60m', new Date(1000 * 60 * 60)],
      ['0h', new Date(0)],
      ['24h', new Date(1000 * 60 * 60 * 24)],
      ['0d', new Date(0)],
      ['7d', new Date(1000 * 60 * 60 * 24 * 7)],
      ['0w', new Date(0)],
      ['52w', new Date(1000 * 60 * 60 * 24 * 7 * 52)]
    ])(
      'should use the expected expire date',
      async (expire: string, expireDate: Date) => {
        jest.spyOn(config, 'get').mockReturnValue(expire);
        jest.spyOn(global.Date, 'now').mockReturnValue(0);
        jest
          .spyOn(repo, 'update')
          .mockResolvedValue({ affected: 1 } as UpdateResult);

        await svc.extendExpireDate(user.id);
        expect(repo.update).toHaveBeenCalledWith(
          user.id,
          expect.objectContaining({ expireDate })
        );
      }
    );
  });

  describe(SessionService.prototype.delete.name, () => {
    it.each([[0], [1], [2]])(
      'should return the number of affected rows',
      async (affected: number) => {
        jest
          .spyOn(repo, 'delete')
          .mockResolvedValue({ affected } as DeleteResult);

        const actual = await svc.delete({ id: session.id });
        expect(actual).toEqual(affected);
      }
    );
  });

  describe(SessionService.prototype.sessionCookieKey.name, () => {
    it('should return the expected session id cookie key', () => {
      expect(svc.sessionCookieKey()).toEqual('session_id');
    });
  });

  describe(SessionService.prototype.sessionCookiePath.name, () => {
    it('should return the expected session id cookie path', () => {
      expect(svc.sessionCookiePath()).toEqual('/');
    });
  });

  // TODO
  describe(SessionService.prototype.setSessionCookie.name, () => {
    it('should set a session id cookie on the response with expected attributes', () => {});
  });

  // TODO
  describe(SessionService.prototype.clearSessionCookie.name, () => {
    it('should clear the session id cookie on the response with expected attributes', () => {});
  });
});
