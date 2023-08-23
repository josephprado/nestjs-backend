import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards
} from '@nestjs/common';
import { LogService } from 'src/log/log.service';
import { AuthService } from '../service/auth.service';
import { SignupDto } from '../dto/signup.dto';
import { LoginDto } from '../dto/login.dto';
import { UserMapper } from 'src/auth/user/mapper/user.mapper';
import { UserDto } from 'src/auth/user/dto/user.dto';
import { Session } from '../entity/session.entity';
import { AuthRequest } from 'src/auth/auth-request.dto';
import { Response } from 'express';
import { SessionGuard } from '../guard/session.guard';

/**
 * Provides authentication services.
 */
@Controller('/auth')
export class AuthController {
  constructor(
    private readonly LOGGER: LogService,
    private readonly AUTH_SVC: AuthService,
    private readonly USER_MAP: UserMapper
  ) {}

  SESSION_ID_KEY = 'session_id';
  SESSION_ID_PATH = '/';

  /**
   * Registers a new user with the application. If successful, a session id
   * will be set as an HTTP-only cookie on the client.
   *
   * @param dto A signup DTO.
   * @param res An HTTP response.
   * @returns A user DTO.
   */
  @Post('/signup')
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<UserDto> {
    this.LOGGER.log(`Signup username ${dto.username}.`);
    const session = await this.AUTH_SVC.signup(dto);
    this.setSessionCookie(session, res);
    return this.USER_MAP.userToDto(session.createUser);
  }

  /**
   * Validates the user credentials. If valid, a session id will be set as an
   * HTTP-only cookie on the client.
   *
   * @param dto A login DTO
   * @param res An HTTP response.
   * @returns A user DTO.
   */
  @HttpCode(HttpStatus.OK)
  @Post('/login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<UserDto> {
    this.LOGGER.log(`Login attempt by username ${dto.username}.`);
    const session = await this.AUTH_SVC.login(dto);
    this.setSessionCookie(session, res);
    return this.USER_MAP.userToDto(session.createUser);
  }

  /**
   * Invalidates the current session for the requesting user.
   *
   * @param req An authorized HTTP request.
   * @param res An HTTP response.
   * @returns True if the logout was successful, or false otherwise.
   */
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/logout')
  async logout(
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) res: Response
  ): Promise<boolean> {
    this.LOGGER.log(`Logout user id ${req.user.sub}.`);
    res.clearCookie(this.SESSION_ID_KEY, { path: this.SESSION_ID_PATH });
    return await this.AUTH_SVC.logout(req.user.sub);
  }

  /**
   * Sets the session id as a cookie on the given response. The cookie
   * will have the following attributes:
   * - HttpOnly
   * - Secure
   * - Path: {@link SESSION_ID_PATH}
   * - SameSite: 'strict'
   * - Expires: Now + an amount of time defined in the current environment's .env file.
   *
   * @param session A session.
   * @param response An HTTP response.
   */
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
