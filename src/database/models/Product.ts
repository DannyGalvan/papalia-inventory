import {Column, Entity, OneToMany, PrimaryColumn} from 'typeorm';
import {LogDetail} from './LogDetail';

@Entity()
export class Product {
  @PrimaryColumn('varchar') code: string;
  @Column('varchar') name: string;
  @Column('varchar') description: string;
  @Column('decimal') price: number;
  @Column('integer') stock: number;
  @OneToMany(() => LogDetail, logDetail => logDetail.product, {cascade: true})
  logDetails: LogDetail[];
}
