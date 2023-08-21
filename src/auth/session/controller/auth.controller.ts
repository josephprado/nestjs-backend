import { Body, Controller, Res } from '@nestjs/common';
import { LogService } from 'src/log/log.service';
import { AuthService } from '../service/auth.service';
import { SignupDto } from '../dto/signup.dto';
import { LoginDto } from '../dto/login.dto';
import { UserMapper } from 'src/auth/user/mapper/user.mapper';
import { UserDto } from 'src/auth/user/dto/user.dto';
import { Session } from '../entity/session.entity';
import { Response } from 'express';

@Controller('/auth')
export class AuthController {
  constructor(
    private readonly LOGGER: LogService,
    private readonly AUTH_SVC: AuthService,
    private readonly USER_MAP: UserMapper
  ) {}

  SESSION_ID_KEY = 'session_id';
  SESSION_ID_PATH = '/api';

  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<UserDto> {
    this.LOGGER.log(`Signup username ${dto.username}.`);
    const session = await this.AUTH_SVC.signup(dto);
    this.setSessionCookie(session, res);
    return this.USER_MAP.userToDto(session.createUser);
  }

  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<UserDto> {
    this.LOGGER.log(`Login attempt by username ${dto.username}.`);
    const session = await this.AUTH_SVC.login(dto);
    this.setSessionCookie(session, res);
    return this.USER_MAP.userToDto(session.createUser);
  }

  async logout(id: string): Promise<boolean> {
    this.LOGGER.log(`Logout user id ${id}.`);
    return await this.AUTH_SVC.logout(id);
  }

  private setSessionCookie(session: Session, response: Response): void {
    response.cookie(this.SESSION_ID_KEY, session.id, {
      // Cookie is inaccessible to JavaScript Document.cookie API
      httpOnly: true,

      // Browser only sends cookie on HTTPS requests (not HTTP)
      secure: true,

      // Browser only sends cookie if this path is present in the URL
      path: this.SESSION_ID_PATH,

      // Browser only sends cookie with requests to the cookie's origin site.
      // If sameSite=lax, browser also sends cookie when user navigates to origin site (from a link)
      sameSite: 'strict',

      expires: session.expireDate
    });
  }
}
