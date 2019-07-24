import {BaseEntity, School} from './internals';
import {Entity, Column, OneToMany, ManyToOne} from 'typeorm';


@Entity()
export class AcademicPeriod extends BaseEntity{

    @Column()
    date_begin: Date;

    @Column()
    date_end: Date;

    @ManyToOne(type => AcademicPeriod, period => period.children)
    parent: AcademicPeriod;

    @OneToMany(type=> AcademicPeriod, period => period.parent)
    children: AcademicPeriod[];

    @ManyToOne(type => School, school => school.academicPeriods)
    school: School;

    constructor(name: string, title: string, date_begin: Date, date_end: Date,
      school: School){
        super(name, title);
        this.date_begin = date_begin;
        this.date_end = date_end;
        this.school = school;
      }
}