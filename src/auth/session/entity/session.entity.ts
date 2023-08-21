import { Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserHistory } from '../../user/entity/user-history.entity';
import { IsNotEmpty } from 'class-validator';

@Entity()
export class Session extends UserHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @IsNotEmpty()
  expireDate: Date;
}
