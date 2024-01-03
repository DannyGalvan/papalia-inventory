import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {LogHeader} from './LogHeader';
import {Product} from './Product';

@Entity()
export class LogDetail {
  @PrimaryGeneratedColumn('increment') id: number;
  @Column('varchar') productCode: string;
  @Column('integer') logHeaderId: number;
  @Column('varchar') name: string;
  @Column('integer') quantity: number;
  @Column('decimal') price: number;
  @Column('decimal') total: number;
  @ManyToOne(() => LogHeader, logHeader => logHeader.logDetails)
  logHeader?: LogHeader;
  @ManyToOne(() => Product, product => product.logDetails)
  product: Product;
}
