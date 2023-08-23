import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from 'src/auth/user/service/user.service';
import { User } from 'src/auth/user/entity/user.entity';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { randomUUID } from 'crypto';
import { SignupDto } from '../dto/signup.dto';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';

describe(AuthService.name, () => {
  let authSvc: AuthService;
  let userSvc: UserService;
  let passSvc: PasswordService;
  let sesSvc: SessionService;
  let user: User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            create: jest.fn(),
            findOne: jest.fn()
          }
        },
        {
          provide: PasswordService,
          useValue: {
            create: jest.fn(),
            validate: jest.fn()
          }
        },
        {
          provide: SessionService,
          useValue: {
            create: jest.fn(),
            delete: jest.fn()
          }
        }
      ]
    }).compile();

    authSvc = module.get<AuthService>(AuthService);
    userSvc = module.get<UserService>(UserService);
    passSvc = module.get<PasswordService>(PasswordService);
    sesSvc = module.get<SessionService>(SessionService);
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

  describe(AuthService.prototype.signup.name, () => {
    let dto: SignupDto;

    beforeEach(() => {
      dto = {
        username: 'username',
        email: 'username@email.com',
        password: 'password'
      };
    });

    it('should throw BadRequestException if username already exists', async () => {
      jest
        .spyOn(userSvc, 'findOne')
        .mockImplementation(async (options) =>
          options.where['username'] === dto.username ? user : null
        );
      expect(async () => await authSvc.signup(dto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should create a new user', async () => {
      await authSvc.signup(dto);
      expect(userSvc.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: dto.username,
          email: dto.email
        })
      );
    });

    it('should create a password for the new user', async () => {
      jest
        .spyOn(userSvc, 'create')
        .mockImplementation(async (x) =>
          x.username === dto.username ? user : null
        );
      await authSvc.signup(dto);

      expect(passSvc.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: dto.username,
          email: dto.email
        }),
        dto.password
      );
    });

    it('should create a session for the new user', async () => {
      jest
        .spyOn(userSvc, 'create')
        .mockImplementation(async (x) =>
          x.username === dto.username ? user : null
        );
      await authSvc.signup(dto);

      expect(sesSvc.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: dto.username,
          email: dto.email
        })
      );
    });
  });

  describe(AuthService.prototype.login.name, () => {
    let dto: LoginDto;

    beforeEach(() => {
      dto = {
        username: 'username',
        password: 'password'
      };
    });

    it('should throw UnauthorizedException when the username does not exist', async () => {
      jest.spyOn(passSvc, 'validate').mockImplementation(async () => {
        throw new NotFoundException();
      });
      expect(async () => await authSvc.login(dto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException when the password is invalid', async () => {
      jest.spyOn(passSvc, 'validate').mockResolvedValue(false);
      expect(async () => await authSvc.login(dto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should create a new session for the user', async () => {
      jest
        .spyOn(passSvc, 'validate')
        .mockImplementation(
          async (x, y) => x === dto.username && y === dto.password
        );
      jest
        .spyOn(userSvc, 'findOne')
        .mockImplementation(async (options) =>
          options.where['username'] === user.username ? user : null
        );

      await authSvc.login(dto);
      expect(sesSvc.create).toHaveBeenCalledWith(
        expect.objectContaining({ username: dto.username })
      );
    });
  });

  describe(AuthService.prototype.logout.name, () => {
    it('should delete the current session', async () => {
      await authSvc.logout(user.id);
      expect(sesSvc.delete).toHaveBeenCalledWith({
        createUser: { id: user.id }
      });
    });
  });
});
