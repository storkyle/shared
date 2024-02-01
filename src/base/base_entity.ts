import { Column, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

// internal modules
import { ERecordStatus } from '../enum';

export class BaseEntityWithoutId<StatusType = ERecordStatus> {
  // required fields
  @Column({ type: 'int', default: ERecordStatus.ACTIVE })
  status: StatusType;

  @Column({ type: 'boolean', default: false })
  removed: boolean;

  @Column({ type: 'uuid', nullable: true })
  creator: string;

  @Column({ type: 'uuid', nullable: true })
  updater: string;

  @Column({ type: 'uuid', nullable: true })
  remover: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  removed_at: Date;
}

export class BaseEntity<StatusType = ERecordStatus> extends BaseEntityWithoutId<StatusType> {
  @PrimaryGeneratedColumn('uuid')
  id: string;
}
