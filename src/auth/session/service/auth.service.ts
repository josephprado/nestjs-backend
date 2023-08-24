import {
  BadRequestException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { LogService } from 'src/log/log.service';
import { UserService } from '../../user/service/user.service';
import { User } from '../../user/entity/user.entity';
import { SignupDto } from '../dto/signup.dto';
import { LoginDto } from '../dto/login.dto';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { Session } from '../entity/session.entity';

/**
 * Provides authentication services.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly LOGGER: LogService,
    private readonly USER_SVC: UserService,
    private readonly PASS_SVC: PasswordService,
    private readonly SES_SVC: SessionService
  ) {
    this.LOGGER.setContext(AuthService.name);
  }

  /**
   * Registers a new user with the application. if successful, a new
   * session is created for the user.
   *
   * @param dto A signup DTO.
   * @returns A session.
   * @throws BadRequestException if the provided username already exists
   * in the database.
   */
  async signup(dto: SignupDto): Promise<Session> {
    const { username, email, password } = dto;

    const existingUser = await this.USER_SVC.findOne({
      where: { username }
    });

    if (existingUser) {
      const message = 'User already exists.';
      this.LOGGER.error(message);
      throw new BadRequestException(message);
    }

    let user = new User();
    user.username = username;
    user.email = email;
    user = await this.USER_SVC.create(user);

    await this.PASS_SVC.create(user, password);
    return await this.SES_SVC.create(user);
  }

  /**
   * Validates the given user credentials. If valid, a new session is created
   * for the user.
   *
   * @param dto A login DTO.
   * @returns A session.
   * @throws UnauthorizedException if the password does not match the database
   * record, or if the username does not exist.
   */
  async login(dto: LoginDto): Promise<Session> {
    const handleUnauthorized = () => {
      const message = 'The user credentials are invalid.';
      this.LOGGER.error(message);
      throw new UnauthorizedException(message);
    };

    const { username, password } = dto;

    try {
      const validPassword = await this.PASS_SVC.validate(username, password);
      if (!validPassword) handleUnauthorized();
    } catch {
      handleUnauthorized();
    }

    const user = await this.USER_SVC.findOne({ where: { username } });
    return await this.SES_SVC.create(user);
  }

  /**
   * Invalidates all sessions for the identified user.
   *
   * @param id A user id.
   * @returns True if the logout was successful, or false otherwise.
   */
  async logout(id: string): Promise<boolean> {
    return (await this.SES_SVC.delete({ createUser: { id } })) > 0;
  }
}
