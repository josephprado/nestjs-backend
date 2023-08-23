import {
  BadRequestException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
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
    private readonly USER_SVC: UserService,
    private readonly PASS_SVC: PasswordService,
    private readonly SES_SVC: SessionService
  ) {}

  async signup(dto: SignupDto): Promise<Session> {
    const { username, email, password } = dto;

    const existingUser = await this.USER_SVC.findOne({
      where: { username }
    });

    if (existingUser) throw new BadRequestException('User already exists.');

    let user = new User();
    user.username = username;
    user.email = email;
    user = await this.USER_SVC.create(user);

    await this.PASS_SVC.create(user, password);
    return await this.SES_SVC.create(user);
  }

  async login(dto: LoginDto): Promise<Session> {
    const handleUnauthorized = () => {
      throw new UnauthorizedException('The user credentials are invalid.');
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

  async logout(id: string): Promise<boolean> {
    return (await this.SES_SVC.delete({ createUser: { id } })) > 0;
  }
}
