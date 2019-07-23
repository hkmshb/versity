import {BaseEntity, Department} from './internals';
import {Entity, Column, ManyToOne} from 'typeorm';


@Entity()
export class Programme extends BaseEntity{

  @Column()
  duration: number;

  @ManyToOne(type => Department, department => department.programmes)
  department: Department


  constructor(name: string, title: string, duration: number, department: Department){
    super(name, title);
    this.duration = duration;
    this.department = department;
  }
}