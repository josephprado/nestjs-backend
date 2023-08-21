import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Base } from 'src/shared/entity/base.entity';
import { IsEmail, IsNotEmpty } from 'class-validator';

@Entity()
export class User extends Base {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @IsNotEmpty()
  @Column({ unique: true })
  username: string;

  @IsEmail()
  @Column()
  email: string;
}
