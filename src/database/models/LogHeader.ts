import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
import {LogDetail} from './LogDetail';

@Entity()
export class LogHeader {
  @PrimaryGeneratedColumn('increment') id: number;
  @Column('integer') type: number;
  @Column('varchar') commets: string;
  @Column('datetime') createdAt: Date;
  @Column('boolean') isInput: boolean;
  @OneToMany(() => LogDetail, logDetail => logDetail.logHeader, {cascade: true})
  logDetails: LogDetail[];
}
