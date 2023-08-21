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

@Injectable()
export class AuthService {
  constructor(
    private readonly LOGGER: LogService,
    private readonly USER_SVC: UserService,
    private readonly PASS_SVC: PasswordService,
    private readonly SES_SVC: SessionService
  ) {}

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

  async login(dto: LoginDto): Promise<Session> {
    const handleUnauthorized = () => {
      const message = 'The user credentials are invalid.';
      this.LOGGER.error(message);
      throw new UnauthorizedException(message);
    };

    const { username, password } = dto;
    const user = await this.USER_SVC.findOne({ where: { username } });
    if (!user) handleUnauthorized();

    try {
      const validPassword = this.PASS_SVC.validate(username, password);
      if (!validPassword) handleUnauthorized();
    } catch {
      // This should never happen, as there should be a 1:1 relation of user to password.
      const message = `Password not found for user id ${user.id}.`;
      this.LOGGER.error(message);
      throw new Error();
    }
    return await this.SES_SVC.create(user);
  }

  async logout(id: string): Promise<boolean> {
    return (await this.SES_SVC.delete({ createUser: { id } })) > 0;
  }
}
