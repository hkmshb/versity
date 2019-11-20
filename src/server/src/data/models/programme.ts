import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import Course from './course';
import Department from './department';
import NamedEntity from './entity';


@Entity()
export default class Programme extends NamedEntity {

  @Column({ type: 'integer', nullable: false })
  duration: number;

  @ManyToOne(type => Department, department => department.programmes)
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @OneToMany(type => Course, course => course.programme)
  courses: Course[];

}
