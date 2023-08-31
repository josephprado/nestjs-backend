import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from 'src/app/app.module';
import { AuthSessionModule } from 'src/auth/session/auth-session.module';
import { AuthController } from 'src/auth/session/controller/auth.controller';
import { SignupDto } from 'src/auth/session/dto/signup.dto';
import { LoginDto } from 'src/auth/session/dto/login.dto';
import { User } from 'src/auth/user/entity/user.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Password } from 'src/auth/session/entity/password.entity';
import { Session } from 'src/auth/session/entity/session.entity';
import cookieParser from 'cookie-parser';

describe(`${AuthSessionModule.name} (e2e)`, () => {
  const SIGNUP_ENDPOINT = '/auth/signup';
  const LOGIN_ENDPOINT = '/auth/login';
  const LOGOUT_ENDPOINT = '/auth/logout';

  let app: INestApplication;
  let userRepo: Repository<User>;
  let passRepo: Repository<Password>;
  let sesRepo: Repository<Session>;
  let signupDto: SignupDto;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [
        {
          provide: getRepositoryToken(User),
          useClass: Repository<User>
        },
        {
          provide: getRepositoryToken(Password),
          useClass: Repository<Password>
        },
        {
          provide: getRepositoryToken(Session),
          useClass: Repository<Session>
        }
      ]
    }).compile();

    app = module.createNestApplication();
    app.use(cookieParser());
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    passRepo = module.get<Repository<Password>>(getRepositoryToken(Password));
    sesRepo = module.get<Repository<Session>>(getRepositoryToken(Session));
    signupDto = {
      username: 'username',
      email: 'username@email.com',
      password: 'password'
    };

    await app.init();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await userRepo.query('DELETE FROM db_user');
    await app.close();
  });

  describe(AuthController.prototype.signup.name, () => {
    it('should return CREATED status if signup succeeds', async () => {
      await request(app.getHttpServer())
        .post(SIGNUP_ENDPOINT)
        .send(signupDto)
        .expect(HttpStatus.CREATED);
    });

    it('should return BAD_REQUEST status if username already exists', async () => {
      userRepo.save({
        username: signupDto.username,
        email: signupDto.email
      });
      await request(app.getHttpServer())
        .post(SIGNUP_ENDPOINT)
        .send(signupDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should create a password for the new user', async () => {
      await request(app.getHttpServer())
        .post(SIGNUP_ENDPOINT)
        .send(signupDto)
        .expect(async ({ body: userDto }) => {
          const passwords = await passRepo.findBy({ userId: userDto.id });
          expect(passwords.length).toEqual(1);
        });
    });

    it('should create a session for the new user', async () => {
      await request(app.getHttpServer())
        .post(SIGNUP_ENDPOINT)
        .send(signupDto)
        .expect(async ({ body: userDto }) => {
          const sessions = await sesRepo.findBy({
            createUser: { id: userDto.id }
          });
          expect(sessions.length).toEqual(1);
        });
    });

    it('should return the new user DTO', async () => {
      await request(app.getHttpServer())
        .post(SIGNUP_ENDPOINT)
        .send(signupDto)
        .expect(async ({ body: userDto }) => {
          expect(userDto).toEqual(
            expect.objectContaining({
              username: signupDto.username,
              email: signupDto.email
            })
          );
        });
    });

    it('should add a session id cookie to the response', async () => {
      await request(app.getHttpServer())
        .post(SIGNUP_ENDPOINT)
        .send(signupDto)
        .expect(async ({ headers }) => {
          const sessionCookie = headers['set-cookie'].find((cookie: string) =>
            cookie.startsWith('session_id')
          );
          expect(sessionCookie).toBeDefined();
          expect(sessionCookie).toContain('HttpOnly');
          expect(sessionCookie).toContain('Secure');
          expect(sessionCookie).toContain('Path=/');
          expect(sessionCookie).toContain('SameSite=Strict');
        });
    });
  });

  describe(AuthController.prototype.login.name, () => {
    let loginDto: LoginDto;

    beforeEach(async () => {
      loginDto = {
        username: 'username',
        password: 'password'
      };
      const { headers } = await request(app.getHttpServer())
        .post(SIGNUP_ENDPOINT)
        .send(signupDto);

      // Delete session so we can login fresh.
      const sessionId = headers['set-cookie']
        .find((cookie: string) => cookie.startsWith('session_id'))
        .split(';')[0]
        .trim()
        .replace('session_id=', '');
      await sesRepo.delete({ id: sessionId });
    });

    it('should return OK status if login succeeds', async () => {
      await request(app.getHttpServer())
        .post(LOGIN_ENDPOINT)
        .send(loginDto)
        .expect(HttpStatus.OK);
    });

    it('should return UNAUTHORIZED status if username does not exist', async () => {
      await request(app.getHttpServer())
        .post(LOGIN_ENDPOINT)
        .send({
          username: loginDto.username + '1',
          password: loginDto.password
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return UNAUTHORIZED status if password is incorrect', async () => {
      await request(app.getHttpServer())
        .post(LOGIN_ENDPOINT)
        .send({
          username: loginDto.username,
          password: loginDto.password + '1'
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should create a session for the user', async () => {
      await request(app.getHttpServer())
        .post(LOGIN_ENDPOINT)
        .send(loginDto)
        .expect(async ({ body: userDto }) => {
          const sessions = await sesRepo.findBy({
            createUser: { id: userDto.id }
          });
          expect(sessions.length).toEqual(1);
        });
    });

    it('should return the user DTO', async () => {
      await request(app.getHttpServer())
        .post(LOGIN_ENDPOINT)
        .send(loginDto)
        .expect(async ({ body: userDto }) => {
          expect(userDto).toEqual(
            expect.objectContaining({
              username: loginDto.username,
              email: signupDto.email
            })
          );
        });
    });

    it('should add a session id cookie to the response', async () => {
      await request(app.getHttpServer())
        .post(LOGIN_ENDPOINT)
        .send(loginDto)
        .expect(async ({ headers }) => {
          const sessionCookie = headers['set-cookie'].find((cookie: string) =>
            cookie.startsWith('session_id')
          );
          expect(sessionCookie).toBeDefined();
          expect(sessionCookie).toContain('HttpOnly');
          expect(sessionCookie).toContain('Secure');
          expect(sessionCookie).toContain('Path=/');
          expect(sessionCookie).toContain('SameSite=Strict');
        });
    });
  });

  describe(AuthController.prototype.logout.name, () => {
    let sessionCookie: string;

    beforeEach(async () => {
      const { headers } = await request(app.getHttpServer())
        .post(SIGNUP_ENDPOINT)
        .send(signupDto);

      sessionCookie = headers['set-cookie'].find((cookie: string) =>
        cookie.startsWith('session_id')
      );
    });

    it('should return OK status if logout succeeds', async () => {
      await request(app.getHttpServer())
        .post(LOGOUT_ENDPOINT)
        .set('Cookie', sessionCookie)
        .expect(HttpStatus.OK);
    });

    it('should return UNAUTHORIZED status if no session id cookie', async () => {
      await request(app.getHttpServer())
        .post(LOGOUT_ENDPOINT)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return UNAUTHORIZED status if session id cookie is invalid', async () => {
      await request(app.getHttpServer())
        .post(LOGOUT_ENDPOINT)
        .set('Cookie', 'xyz')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should delete all sessions of the user', async () => {
      await request(app.getHttpServer())
        .post(LOGOUT_ENDPOINT)
        .set('Cookie', sessionCookie)
        .expect(async () => {
          const sessions = await sesRepo.findBy({
            createUser: { username: signupDto.username }
          });
          expect(sessions.length).toEqual(0);
        });
    });

    it('should remove the session id cookie in the response', async () => {
      await request(app.getHttpServer())
        .post(LOGOUT_ENDPOINT)
        .set('Cookie', sessionCookie)
        .expect(({ headers }) => {
          const cookie = headers['set-cookie']
            .find((cookie: string) => cookie.startsWith('session_id=;'))
            .split(';')
            .reduce((prev: any, curr: string) => {
              const [key, val] = curr.split('=');
              prev[key.trim().toLowerCase()] = val?.trim().toLowerCase();
              return prev;
            }, {});

          expect(cookie).toBeDefined();
          expect(cookie.session_id).toEqual('');
          expect(cookie.path).toEqual('/');
          expect(new Date(cookie.expires).getTime()).toBeLessThan(Date.now());
        });
    });
  });
});
