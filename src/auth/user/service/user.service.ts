import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LogService } from 'src/log/log.service';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { User } from '../entity/user.entity';

@Injectable()
export class UserService {
  constructor(
    private readonly LOGGER: LogService,
    @InjectRepository(User) private readonly REPO: Repository<User>
  ) {
    this.LOGGER.setContext(UserService.name);
  }

  async create(user: User): Promise<User> {
    return await this.REPO.save(user);
  }

  async findAll(options?: FindManyOptions<User>): Promise<User[]> {
    return await this.REPO.find(options);
  }

  async findOne(options: FindOneOptions<User>): Promise<User> {
    return await this.REPO.findOne(options);
  }

  async update(id: string, updates: Partial<User>): Promise<number> {
    const { affected } = await this.REPO.update(id, updates);
    return affected ?? 0;
  }

  async delete(id: string): Promise<number> {
    const { affected } = await this.REPO.delete(id);
    return affected ?? 0;
  }
}
