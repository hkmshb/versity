import {BaseEntity, Department} from './internals';
import {Entity, ManyToOne} from 'typeorm';


@Entity()
export class Lecturer extends BaseEntity{

  @ManyToOne(type => Department, department => department.lecturers)
  department: Department;

  constructor(name: string, title: string, department: Department){
    super(name, title);
    this.department = department;
  }
}