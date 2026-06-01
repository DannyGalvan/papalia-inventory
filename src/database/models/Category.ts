import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('product_category')
export class Category {
  @PrimaryGeneratedColumn('increment') id: number;
  @Column('varchar') name: string;
  @Column('varchar', {default: ''}) description: string;
  @Column('varchar', {default: '#6B7280'}) color: string;
  @Column('boolean', {default: true}) isActive: boolean;
}
