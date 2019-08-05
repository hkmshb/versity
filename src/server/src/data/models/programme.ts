import {Column, Entity, ManyToOne, OneToMany} from 'typeorm';
import {BaseEntity, Course, Department} from './internals';


@Entity()
export class Programme extends BaseEntity {

  @Column()
  duration: number;

  @ManyToOne(type => Department, department => department.programmes)
  department: Department;

  @OneToMany(type => Course, course => course.programme)
  courses: Course[];


  constructor(name: string, title: string, duration: number, department: Department) {
    super(name, title);
    this.duration = duration;
    this.department = department;
  }
}
