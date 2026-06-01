import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('unit_of_measure')
export class UnitOfMeasure {
  @PrimaryGeneratedColumn('increment') id: number;
  @Column('varchar') name: string;
  @Column('varchar') abbreviation: string;
  @Column('boolean', {default: true}) isActive: boolean;
}
