import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('supplier')
export class Supplier {
  @PrimaryGeneratedColumn('increment') id: number;
  @Column('varchar') name: string;
  @Column('varchar', {default: ''}) phone: string;
  @Column('varchar', {default: ''}) email: string;
  @Column('varchar', {default: ''}) address: string;
  @Column('varchar', {default: ''}) notes: string;
  @Column('boolean', {default: true}) isActive: boolean;
}
