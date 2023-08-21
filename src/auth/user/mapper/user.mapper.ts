import { Injectable } from '@nestjs/common';
import { User } from '../entity/user.entity';
import { UserDto } from '../dto/user.dto';

@Injectable()
export class UserMapper {
  userToDto(user: User): UserDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email
    };
  }
}
