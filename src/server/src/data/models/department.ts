import { Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import NamedEntity from './entity';
import Lecturer from './lecturer';
import Programme from './programme';
import School from './school';


@Entity()
export default class Department extends NamedEntity {

  @ManyToOne(type => School, school => school.departments)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @OneToMany(type => Programme, programme => programme.department)
  programmes: Programme[];

  @OneToMany(type => Lecturer, lecturer => lecturer.department)
  lecturers: Lecturer[];

}
