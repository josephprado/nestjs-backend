import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Password } from '../entity/password.entity';
import { User } from 'src/auth/user/entity/user.entity';
import { randomUUID } from 'crypto';
import argon2 from 'argon2';

@Injectable()
export class PasswordService {
  constructor(
    @InjectRepository(Password) private readonly REPO: Repository<Password>
  ) {}

  async create(user: User, rawPassword: string): Promise<boolean> {
    const password = new Password();
    password.createUser = user;
    password.updateUser = user;
    password.salt = randomUUID();
    password.hash = await argon2.hash(rawPassword + password.salt);

    await this.REPO.save(password);
    return true;
  }

  async update(userId: string, updates: Partial<Password>): Promise<number> {
    const { affected } = await this.REPO.update(
      { createUser: { id: userId } },
      updates
    );
    return affected ?? 0;
  }

  async validate(username: string, rawPassword: string): Promise<boolean> {
    const password = await this.REPO.findOne({
      where: { createUser: { username } }
    });
    if (!password) throw new NotFoundException();
    return await argon2.verify(rawPassword + password.salt, password.hash);
  }
}
