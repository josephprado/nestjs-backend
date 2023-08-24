import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn
} from 'typeorm';
import { Base } from 'src/shared/entity/base.entity';
import { User } from 'src/auth/user/entity/user.entity';
import { IsNotEmpty } from 'class-validator';

/**
 * Represents a user's password. When a user signs up (or changes their password),
 * the user's raw (plain-text) password is passed through a secure hashing algorithm
 * to generate the hash. This hash, together with the hashing algorithm, will be used
 * to verify a given password when logging in.
 */
@Entity()
export class Password extends Base {
  // See https://stackoverflow.com/questions/66723603/typeorm-onetoone-relation-joined-by-primary-key#:~:text=After%20%40PrimaryColumn%20add%20%40OneToOne%20relation,and%20the%20Foreign%20Key%20relation
  @PrimaryColumn()
  userId: string;

  @OneToOne(() => User, {
    onDelete: 'CASCADE',
    nullable: false
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @BeforeInsert()
  newId() {
    this.userId = this.user.id;
  }

  @IsNotEmpty()
  @Column()
  hash: string;
}
