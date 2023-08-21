import { PickType } from '@nestjs/mapped-types';
import { User } from '../entity/user.entity';

export class UserDto extends PickType(User, [
  'id',
  'username',
  'email'
] as const) {}
