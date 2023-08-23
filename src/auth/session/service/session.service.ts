import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Session } from '../entity/session.entity';
import { User } from '../../user/entity/user.entity';

/**
 * Provides services for managing user sessions.
 */
@Injectable()
export class SessionService {
  constructor(
    private readonly CONFIG: ConfigService,
    @InjectRepository(Session) private readonly REPO: Repository<Session>
  ) {}

  /**
   * Creates a new user session. The session expiry is defined
   * by the current environment's .env file.
   *
   * @param user The user owning the session.
   * @returns The created session.
   */
  async create(user: User): Promise<Session> {
    const session = new Session();
    session.createUser = user;
    session.updateUser = user;
    session.expireDate = this.getNewExpireDate();

    return await this.REPO.save(session);
  }

  /**
   * Finds the identified session.
   *
   * @param id A session id.
   * @returns The session, including its associated user, or null if it does
   * not exist.
   */
  async findOneById(id: string): Promise<Session | null> {
    return await this.REPO.findOne({
      where: { id },
      relations: { createUser: true }
    });
  }

  /**
   * Extends the expiration date of the identified session. The date
   * is extended by the amount specified in the current environment's
   * .env file.
   *
   * @param id A session id.
   * @returns The number of sessions affected by the operation (1 or 0).
   */
  async extendExpireDate(id: string): Promise<number> {
    const { affected } = await this.REPO.update(id, {
      expireDate: this.getNewExpireDate()
    });
    return affected ?? 0;
  }

  /**
   * Deletes the identified session(s).
   *
   * @param options Filters to specify which sessions to delete.
   * @returns The number of sessions affected by the deletion.
   */
  async delete(options: FindOptionsWhere<Session>): Promise<number> {
    const { affected } = await this.REPO.delete(options);
    return affected ?? 0;
  }

  /**
   * Calculates the expiration date for a new/extended session, based on
   * the 'SESSION_EXPIRE' property in the current environment's .env file.
   * The acceptable time units for this property are:
   * - `s`: seconds, e.g., 60s
   * - `m`: minutes, e.g., 60m
   * - `h`: hours, e.g., 24h
   * - `d`: days, e.g., 365d
   * - `w`: weeks, e.g., 52w
   *
   * @returns A date.
   */
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
    return new Date(Date.now() + unitConversion[units] * value);
  }
}
