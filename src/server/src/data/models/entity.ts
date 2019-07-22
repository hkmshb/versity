import {PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn} from 'typeorm';

export abstract class BaseEntity{

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  title: string;

  @CreateDateColumn()
  date_created: Date;

  @UpdateDateColumn()
  date_updated: Date;

}