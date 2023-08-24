import { Test, TestingModule } from '@nestjs/testing';
import { UserMapper } from './user.mapper';
import { User } from '../entity/user.entity';
import { UserDto } from '../dto/user.dto';
import { randomUUID } from 'crypto';

describe(UserMapper.name, () => {
  let map: UserMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserMapper]
    }).compile();

    map = module.get<UserMapper>(UserMapper);
  });

  describe(UserMapper.prototype.userToDto.name, () => {
    it('should return the expected user', () => {
      const user: User = {
        id: randomUUID(),
        username: 'username',
        email: 'username@email.com',
        createDate: new Date(),
        updateDate: new Date()
      };
      const dto: UserDto = {
        id: user.id,
        username: user.username,
        email: user.email
      };

      const actual = map.userToDto(user);
      expect(actual).toEqual(dto);
    });
  });
});
