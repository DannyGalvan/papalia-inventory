import {Column, Entity, PrimaryColumn} from 'typeorm';

@Entity()
export class Configuration {
  @PrimaryColumn('varchar') key: string;
  @Column('varchar') value: string;
}
