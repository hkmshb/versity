import {BaseEntity, School, Programme, Lecturer} from './internals';
import {Entity, OneToMany, ManyToOne} from 'typeorm';


@Entity()
export class Department extends BaseEntity {

    @ManyToOne(type => School, school => school.departments)
    faculty: School;

    @OneToMany(type => Programme, programme => programme.department)
    programmes: Programme[];

    @OneToMany(type => Lecturer, lecturer => lecturer.department)
    lecturers: Lecturer[];

    constructor(name:string, title:string, faculty: School) {
      super(name, title);
      this.faculty = faculty;
    }

}