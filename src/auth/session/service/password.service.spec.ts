import { Test, TestingModule } from '@nestjs/testing';
import { LogService } from 'src/log/log.service';
import { Repository, UpdateResult } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PasswordService } from './password.service';
import { Password } from '../entity/password.entity';
import { User } from 'src/auth/user/entity/user.entity';
import { randomUUID } from 'crypto';
import argon2 from 'argon2';
import { NotFoundException } from '@nestjs/common';

describe(PasswordService.name, () => {
  let svc: PasswordService;
  let repo: Repository<Password>;
  let user: User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogService,
        PasswordService,
        {
          provide: getRepositoryToken(Password),
          useValue: {
            save: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn()
          }
        }
      ]
    }).compile();

    svc = module.get<PasswordService>(PasswordService);
    repo = module.get<Repository<Password>>(getRepositoryToken(Password));
    user = {
      id: randomUUID(),
      username: 'username',
      email: 'username@email.com',
      createDate: new Date(),
      updateDate: new Date()
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe(PasswordService.prototype.create.name, () => {
    it('should hash the password before saving to the database and attach the given user', async () => {
      const raw = 'xyz';

      const password = new Password();
      password.user = user;
      password.hash = expect.not.stringMatching(raw);

      await svc.create(user, raw);
      expect(repo.save).toBeCalledWith(password);
    });

    it('should return true when password is created successfully', async () => {
      const raw = 'xyz';

      const password = new Password();
      password.user = user;
      password.hash = expect.not.stringMatching(raw);

      const actual = await svc.create(user, raw);
      expect(actual).toEqual(true);
    });
  });

  describe(PasswordService.prototype.update.name, () => {
    it('should hash the password before saving to the database', async () => {
      const raw = 'xyz';

      jest
        .spyOn(repo, 'update')
        .mockResolvedValue({ affected: 1 } as UpdateResult);

      await svc.update(user.id, raw);
      expect(repo.update).toBeCalledWith(
        { userId: user.id },
        { hash: expect.not.stringMatching(raw) }
      );
    });

    it.each([[0], [1], [2]])(
      'should return the number of affected rows',
      async (affected: number) => {
        const raw = 'xyz';

        jest
          .spyOn(repo, 'update')
          .mockResolvedValue({ affected } as UpdateResult);

        const actual = await svc.update(user.id, raw);
        expect(actual).toEqual(affected);
      }
    );
  });

  describe(PasswordService.prototype.validate.name, () => {
    it("should return true when the raw password's hash is valid", async () => {
      const raw = 'xyz';
      const password = new Password();
      password.user = user;
      password.hash = 'abc';

      jest
        .spyOn(repo, 'findOne')
        .mockImplementation(async (options) =>
          options?.where?.['user']?.username === user.username ? password : null
        );
      jest
        .spyOn(argon2, 'verify')
        .mockImplementation(async (x, y) => x === password.hash && y === raw);

      const actual = await svc.validate(user.username, raw);
      expect(actual).toEqual(true);
    });

    it("should return false when the raw password's hash is invalid", async () => {
      const raw = 'xyz';
      const password = new Password();
      password.user = user;
      password.hash = 'abc';

      jest
        .spyOn(repo, 'findOne')
        .mockImplementation(async (options) =>
          options?.where?.['user']?.username === user.username ? password : null
        );
      jest
        .spyOn(argon2, 'verify')
        .mockImplementation(async (x, y) => x === password.hash && y === raw);

      const actual = await svc.validate(user.username, raw + '1');
      expect(actual).toEqual(false);
    });

    it('should throw NotFoundException if there are no passwords for the given username', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);
      expect(
        async () => await svc.validate(user.username, 'xyz')
      ).rejects.toThrow(NotFoundException);
    });
  });
});
