import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LogService } from 'src/log/log.service';
import { AuthController } from './auth.controller';
import { AuthService } from '../service/auth.service';
import { SignupDto } from '../dto/signup.dto';
import { LoginDto } from '../dto/login.dto';
import { UserMapper } from 'src/auth/user/mapper/user.mapper';
import { User } from 'src/auth/user/entity/user.entity';
import { UserDto } from 'src/auth/user/dto/user.dto';
import { Session } from '../entity/session.entity';
import { SessionGuard } from '../guard/session.guard';
import { randomUUID } from 'crypto';

describe(AuthController.name, () => {
  let con: AuthController;
  let authSvc: AuthService;
  let userMap: UserMapper;
  let user: User;
  let userDto: UserDto;
  let res: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        ConfigService,
        LogService,
        {
          provide: AuthService,
          useValue: {
            signup: jest.fn(),
            login: jest.fn(),
            logout: jest.fn()
          }
        },
        UserMapper
      ]
    })
      .overrideGuard(SessionGuard)
      .useValue({})
      .compile();

    con = module.get<AuthController>(AuthController);
    authSvc = module.get<AuthService>(AuthService);
    userMap = module.get<UserMapper>(UserMapper);

    user = {
      id: randomUUID(),
      username: 'username',
      email: 'username@email.com',
      createDate: new Date(),
      updateDate: new Date()
    };

    userDto = {
      id: user.id,
      username: user.username,
      email: user.email
    };

    res = {
      cookie: jest.fn(),
      clearCookie: jest.fn()
    };

    jest
      .spyOn(userMap, 'userToDto')
      .mockImplementation((x) => (x === user ? userDto : null));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe(AuthController.prototype.signup.name, () => {
    let dto: SignupDto;
    let session: Session;

    beforeEach(() => {
      dto = {
        username: user.username,
        email: user.email,
        password: 'password'
      };
      session = new Session();
      session.id = randomUUID();
      session.createUser = user;

      jest
        .spyOn(authSvc, 'signup')
        .mockImplementation(async (x) => (x === dto ? session : null));
    });

    it('should return a user DTO', async () => {
      const actual = await con.signup(dto, res);
      expect(actual).toEqual(userDto);
    });

    it('should set a session id cookie', async () => {
      await con.signup(dto, res);
      expect(res.cookie).toHaveBeenCalledTimes(1);
    });
  });

  describe(AuthController.prototype.login.name, () => {
    let dto: LoginDto;
    let session: Session;

    beforeEach(() => {
      dto = {
        username: user.username,
        password: 'password'
      };
      session = new Session();
      session.id = randomUUID();
      session.createUser = user;

      jest
        .spyOn(authSvc, 'login')
        .mockImplementation(async (x) => (x === dto ? session : null));
    });

    it('should return a user DTO', async () => {
      const actual = await con.login(dto, res);
      expect(actual).toEqual(userDto);
    });

    it('should set a session id cookie', async () => {
      await con.login(dto, res);
      expect(res.cookie).toHaveBeenCalledTimes(1);
    });
  });

  describe(AuthController.prototype.logout.name, () => {
    let req: any;

    beforeEach(() => {
      req = {
        user: {
          sub: user.id
        }
      };
    });

    it('should clear the session id cookie', async () => {
      await con.logout(req, res);
      expect(res.clearCookie).toHaveBeenCalledTimes(1);
    });

    it('should return true if the logout succeeds', async () => {
      jest
        .spyOn(authSvc, 'logout')
        .mockImplementation(async (x) => x === user.id);

      const actual = await con.logout(req, res);
      expect(actual).toEqual(true);
    });

    it('should return false if the logout fails', async () => {
      jest
        .spyOn(authSvc, 'logout')
        .mockImplementation(async (x) => x !== user.id);

      const actual = await con.logout(req, res);
      expect(actual).toEqual(false);
    });
  });
});
