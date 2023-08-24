import { Test, TestingModule } from '@nestjs/testing';
import {
  Controller,
  Get,
  HttpStatus,
  INestApplication,
  UseGuards
} from '@nestjs/common';
import request from 'supertest';
import { AuthJwtModule } from 'src/auth/jwt/auth-jwt.module';
import { ConfigService } from '@nestjs/config';
import { LogService } from 'src/log/log.service';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenGuard } from 'src/auth/jwt/access-token.guard';
import { randomUUID } from 'crypto';
import cookieParser from 'cookie-parser';

const ENDPOINT = '/test';

@UseGuards(AccessTokenGuard)
@Controller(ENDPOINT)
class TestController {
  @Get()
  get() {
    return 'Hello world';
  }
}

describe(`${AuthJwtModule.name} (e2e)`, () => {
  let app: INestApplication;
  let config: ConfigService;
  let jwtSvc: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === 'JWT_ACCESS_SECRET'
                ? '0123456789abcdefghijklmnopqrstuvwxyz'
                : null
          }
        },
        LogService,
        JwtService
      ]
    }).compile();

    app = module.createNestApplication();
    app.use(cookieParser());
    config = module.get<ConfigService>(ConfigService);
    jwtSvc = module.get<JwtService>(JwtService);

    await app.init();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  const getAccessToken = async (expiresIn: number) => {
    return await jwtSvc.signAsync(
      {
        sub: randomUUID(),
        username: 'username'
      },
      {
        secret: config.get('JWT_ACCESS_SECRET'),
        expiresIn
      }
    );
  };

  it('should return UNAUTHORIZED status if no access token in header', async () => {
    await request(app.getHttpServer())
      .get(ENDPOINT)
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('should return UNAUTHORIZED status if access token is invalid', async () => {
    await request(app.getHttpServer())
      .get(ENDPOINT)
      .set('authorization', 'xyz')
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('should return UNAUTHORIZED status if access token is expired', async () => {
    await request(app.getHttpServer())
      .get(ENDPOINT)
      .set('authorization', `Bearer ${await getAccessToken(-1)}`)
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('should return OK status if access token is valid', async () => {
    await request(app.getHttpServer())
      .get(ENDPOINT)
      .set('authorization', `Bearer ${await getAccessToken(60 * 5 * 1000)}`)
      .expect(HttpStatus.OK);
  });
});
