import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { Category } from './Category';
import { LogDetail } from './LogDetail';
import { Supplier } from './Supplier';
import { UnitOfMeasure } from './UnitOfMeasure';

@Entity('product')
export class Product {
  @PrimaryColumn('varchar') code: string;
  @Column('varchar') name: string;
  @Column('varchar') description: string;
  @Column('decimal') price: number;
  @Column('integer') stock: number;
  @Column('varchar', {nullable: false, default: ''}) image: string;

  @Column('integer', {nullable: true, default: null}) categoryId: number | null;
  @Column('integer', {nullable: true, default: null}) supplierId: number | null;
  @Column('integer', {nullable: true, default: null}) unitId: number | null;

  @ManyToOne(() => Category, {nullable: true, eager: false, onDelete: 'SET NULL'})
  @JoinColumn({name: 'categoryId'})
  category: Category | null;

  @ManyToOne(() => Supplier, {nullable: true, eager: false, onDelete: 'SET NULL'})
  @JoinColumn({name: 'supplierId'})
  supplier: Supplier | null;

  @ManyToOne(() => UnitOfMeasure, {nullable: true, eager: false, onDelete: 'SET NULL'})
  @JoinColumn({name: 'unitId'})
  unitOfMeasure: UnitOfMeasure | null;

  @OneToMany(() => LogDetail, logDetail => logDetail.product)
  logDetails: LogDetail[];
}
