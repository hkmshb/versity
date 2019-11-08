import { Column, CreateDateColumn, Generated, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export abstract class BaseEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 32, unique: true })
  @Generated('uuid')
  uuid: string;

  @CreateDateColumn({ name: 'date_created', nullable: false })
  dateCreated: Date;

  @UpdateDateColumn({ name: 'last_updated', nullable: true })
  lastUpdated: Date;

}


export default abstract class NamedEntity extends BaseEntity {

  @Column({ type: 'varchar', unique: true, nullable: false })
  name: string;

}
