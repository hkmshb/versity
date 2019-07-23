import {BaseEntity, School} from './internals';
import {Entity, Column, OneToMany, ManyToOne} from 'typeorm';


@Entity()
export class Department extends BaseEntity{

    @ManyToOne(type => School, school => school.departments)
    faculty: School;

    constructor(name:string, title:string, faculty: School){
      super(name, title);
      this.faculty = faculty;
    }

}