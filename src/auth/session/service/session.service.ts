import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Session } from '../entity/session.entity';
import { User } from '../../user/entity/user.entity';

@Injectable()
export class SessionService {
  constructor(
    private readonly CONFIG: ConfigService,
    @InjectRepository(Session) private readonly REPO: Repository<Session>
  ) {}

  async create(user: User): Promise<Session> {
    const session = new Session();
    session.createUser = user;
    session.updateUser = user;
    session.expireDate = this.getNewExpireDate();

    return await this.REPO.save(session);
  }

  async findOneById(id: string): Promise<Session> {
    return await this.REPO.findOne({
      where: { id },
      relations: { createUser: true }
    });
  }

  async extendExpireDate(id: string): Promise<number> {
    const { affected } = await this.REPO.update(id, {
      expireDate: this.getNewExpireDate()
    });
    return affected ?? 0;
  }

  async delete(options: FindOptionsWhere<Session>): Promise<number> {
    const { affected } = await this.REPO.delete(options);
    return affected ?? 0;
  }

  private getNewExpireDate(): Date {
    const expire = this.CONFIG.get('SESSION_EXPIRE');

    const units = expire.charAt(expire.length - 1);
    const value = Number(expire.substring(0, expire.length - 1));

    const unitConversion = {
      s: 1000, // seconds
      m: 1000 * 60, // minutes
      h: 1000 * 60 * 60, // hours
      d: 1000 * 60 * 60 * 24, // days
      w: 1000 * 60 * 60 * 24 * 7 // weeks
    };
    return new Date(new Date().getTime() + unitConversion[units] * value);
  }
}
