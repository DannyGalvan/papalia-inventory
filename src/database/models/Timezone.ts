import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('timezone')
export class Timezone {
  @PrimaryGeneratedColumn('increment') id: number;
  @Column('varchar', {unique: true}) ianaName: string;
  @Column('varchar') displayName: string;
  @Column('varchar') region: string;
  @Column('varchar') utcOffset: string;
  @Column('boolean', {default: true}) isActive: boolean;
}
