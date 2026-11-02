import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('movement_type')
export class MovementType {
  @PrimaryGeneratedColumn('increment') id: number;
  @Column('varchar') name: string;
  @Column('boolean') isInput: boolean;
  @Column('boolean', { default: true }) isActive: boolean;
  /** Output types flagged as sales count as revenue in profit reports. */
  @Column('boolean', { default: false }) isSale: boolean;
}
