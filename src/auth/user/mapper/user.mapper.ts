import { Injectable } from '@nestjs/common';
import { User } from '../entity/user.entity';
import { UserDto } from '../dto/user.dto';

/**
 * Maps between user entities and DTOs.
 */
@Injectable()
export class UserMapper {
  /**
   * Converts a user to a user DTO.
   *
   * @param user A user.
   * @returns A user DTO.
   */
  userToDto(user: User): UserDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email
    };
  }
}
