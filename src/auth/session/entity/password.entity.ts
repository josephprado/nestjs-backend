import { Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserHistory } from '../../user/entity/user-history.entity';
import { IsNotEmpty } from 'class-validator';

@Entity()
export class Password extends UserHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @IsNotEmpty()
  salt: string;

  @IsNotEmpty()
  hash: string;
}
