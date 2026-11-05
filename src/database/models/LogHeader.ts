import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { LogDetail } from './LogDetail';

@Entity('log_header')
export class LogHeader {
  @PrimaryGeneratedColumn('increment') id: number;
  @Column('integer') type: number;
  @Column('varchar') comments: string;
  /** System registration timestamp (audit). Assigned on persistence. */
  @Column('datetime') createdAt: Date;
  /**
   * When the movement actually happened (sale/receipt date), chosen by the
   * user. Drives lists, dashboards and reports. Never persisted as NULL.
   */
  @Column('datetime') movementDate: Date;
  @Column('boolean') isInput: boolean;
  /** Logical cancellation: the movement stays in history, stock is reverted. */
  @Column('boolean', { default: false }) isCancelled: boolean;
  @Column('datetime', { nullable: true, default: null })
  cancelledAt: Date | null;
  @Column('varchar', { default: '' }) cancelReason: string;

  @OneToMany(() => LogDetail, logDetail => logDetail.logHeader)
  logDetails: LogDetail[];
}
