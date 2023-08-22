import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Password } from '../entity/password.entity';
import { User } from 'src/auth/user/entity/user.entity';
import argon2 from 'argon2';

/**
 * Provides services for creating and verifying passwords.
 */
@Injectable()
export class PasswordService {
  constructor(
    @InjectRepository(Password) private readonly REPO: Repository<Password>
  ) {}

  /**
   * Creates a new password for the given user. The given raw password
   * will be passed through a secure hashing algorithm so as to not store
   * it in plain text.
   *
   * @param user The user owning the password.
   * @param rawPassword A raw (plain-text) password.
   * @returns True when the password is created.
   */
  async create(user: User, rawPassword: string): Promise<boolean> {
    const password = new Password();
    password.user = user;

    // See https://github.com/ranisalt/node-argon2/wiki/Options.
    password.hash = await argon2.hash(rawPassword);

    await this.REPO.save(password);
    return true;
  }

  /**
   * Updates the identified user's password. Similar to {@link create},
   * the raw password will be hashed before storing in the database.
   *
   * @param userId A user id.
   * @param rawPassword A raw (plain-text) password.
   * @returns The number of passwords affected by the update (1 or 0).
   */
  async update(userId: string, rawPassword: string): Promise<number> {
    const { affected } = await this.REPO.update(
      { userId },
      { hash: await argon2.hash(rawPassword) }
    );
    return affected ?? 0;
  }

  /**
   * Verifies that the given raw password's hash matches the one stored for
   * the given username.
   *
   * @param username The username of the owner of the password.
   * @param rawPassword A raw (plain-text) password.
   * @returns True if the hashed raw password matches the database record,
   * or false otherwise.
   * @throws NotFoundException if a password for the given username does not exist.
   */
  async validate(username: string, rawPassword: string): Promise<boolean> {
    const password = await this.REPO.findOne({
      where: { user: { username } }
    });
    if (!password) throw new NotFoundException();
    return await argon2.verify(rawPassword, password.hash);
  }
}
