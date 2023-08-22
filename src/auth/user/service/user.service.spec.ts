import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LogService } from 'src/log/log.service';
import { Repository, UpdateResult } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { User } from '../entity/user.entity';
import { randomUUID } from 'crypto';

describe('UserService', () => {
  let svc: UserService;
  let repo: Repository<User>;
  let users: User[];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        LogService,
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
          }
        }
      ]
    }).compile();

    svc = module.get<UserService>(UserService);
    repo = module.get<Repository<User>>(getRepositoryToken(User));
    users = [];

    for (let i = 0; i < 4; i++) {
      users.push({
        id: randomUUID(),
        username: 'username' + i,
        email: 'username' + i + '@email.com',
        createDate: new Date(),
        updateDate: new Date()
      });
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create', () => {
    it('should return the saved user', async () => {
      const testUser = users[0];

      jest
        .spyOn(repo, 'save')
        .mockImplementation(async (user) =>
          user === testUser ? testUser : null
        );

      const user = await svc.create(testUser);
      expect(user).toEqual(testUser);
    });
  });

  describe('findAll', () => {
    it('should return a list of users', async () => {
      jest.spyOn(repo, 'find').mockResolvedValue(users);
      const actual = await svc.findAll();
      expect(actual).toEqual(users);
    });

    it('should return a list of users filtered by the options', async () => {
      const testUser = users[0];

      jest
        .spyOn(repo, 'find')
        .mockImplementation(async (options) =>
          options.where['id'] === testUser.id ? [testUser] : []
        );

      const actual = await svc.findAll({ where: { id: testUser.id } });
      expect(actual).toEqual([testUser]);
    });

    it('should return an empty list when no users match options', async () => {
      jest.spyOn(repo, 'find').mockResolvedValue([]);
      const actual = await svc.findAll({ where: { id: randomUUID() } });
      expect(actual).toEqual([]);
    });
  });

  describe('findOne', () => {
    beforeEach(() => {
      jest
        .spyOn(repo, 'findOne')
        .mockImplementation(
          async (options: any) =>
            users.find((x) => x.id === options.where.id) ?? null
        );
    });

    it.each([[0], [1], [2], [3]])(
      'should return the expected user',
      async (testUser: number) => {
        const actual = await svc.findOne({ where: { id: users[testUser].id } });
        expect(actual).toEqual(users[testUser]);
      }
    );

    it('should return null if the user does not exist', async () => {
      const ids = users.map((x) => x.id);

      let testId: string;
      while (!testId || ids.includes(testId)) testId = randomUUID();

      const actual = await svc.findOne({ where: { id: testId } });
      expect(actual).toBeNull();
    });
  });

  describe('update', () => {
    it.each([[0], [1], [2]])(
      'should return the number of affected rows',
      async (n: number) => {
        jest
          .spyOn(repo, 'update')
          .mockResolvedValue({ affected: n } as UpdateResult);

        const actual = await svc.update(randomUUID(), {});
        expect(actual).toEqual(n);
      }
    );
  });

  describe('delete', () => {
    it.each([[0], [1], [2]])(
      'should return the number of affected rows',
      async (n: number) => {
        jest
          .spyOn(repo, 'delete')
          .mockResolvedValue({ affected: n } as UpdateResult);

        const actual = await svc.delete(randomUUID());
        expect(actual).toEqual(n);
      }
    );
  });
});
