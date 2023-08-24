import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { User } from '../entity/user.entity';

/**
 * Provides services for user entities.
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly REPO: Repository<User>
  ) {}

  /**
   * Creates a new user.
   *
   * @param user A user.
   * @returns The created user.
   */
  async create(user: User): Promise<User> {
    return await this.REPO.save(user);
  }

  /**
   * Finds all users filtered by the given options.
   *
   * @param options Filters to apply to the query (optional).
   * @returns A list of users.
   */
  async findAll(options?: FindManyOptions<User>): Promise<User[]> {
    return await this.REPO.find(options);
  }

  /**
   * Finds a single user.
   *
   * @param options Attributes identifying the desired user.
   * @returns A user, or null if none match the options.
   */
  async findOne(options: FindOneOptions<User>): Promise<User | null> {
    return await this.REPO.findOne(options);
  }

  /**
   * Updates the identified user.
   *
   * @param id A user id.
   * @param updates Updates to the user.
   * @returns The number of users affected by the update (1 or 0).
   */
  async update(id: string, updates: Partial<User>): Promise<number> {
    const { affected } = await this.REPO.update(id, updates);
    return affected ?? 0;
  }

  /**
   * Deletes the identified user.
   *
   * @param id A user id.
   * @returns The number of users affected by the deletion (1 or 0).
   */
  async delete(id: string): Promise<number> {
    const { affected } = await this.REPO.delete(id);
    return affected ?? 0;
  }
}
