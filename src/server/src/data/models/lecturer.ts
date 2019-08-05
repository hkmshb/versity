import {Entity, ManyToOne, OneToMany} from 'typeorm';
import {BaseEntity, Department, Document} from './internals';


@Entity()
export class Lecturer extends BaseEntity {

  @ManyToOne(type => Department, department => department.lecturers)
  department: Department;

  @OneToMany(type => Document, document => document.lecturer)
  documents: Document[];

  constructor(name: string, title: string, department: Department) {
    super(name, title);
    this.department = department;
  }
}
