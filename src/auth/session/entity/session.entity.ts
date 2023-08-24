import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserHistory } from '../../user/entity/user-history.entity';
import { IsNotEmpty } from 'class-validator';

/**
 * Represents a user/client session. Upon logging in, a unique session is created for
 * the client, identified by the session id. This id should be provided by the client
 * on every request to the API in order to authorize their request. When the client
 * logs off or the session expire date passes, the session should be purged from the
 * database and will no longer be valid for authorizing the client.
 */
@Entity()
export class Session extends UserHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @IsNotEmpty()
  @Column()
  expireDate: Date;
}
