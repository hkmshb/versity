import {BaseEntity, Course, Lecturer, AcademicPeriod} from './internals';
import {Entity, Column, OneToMany, ManyToOne} from 'typeorm';


@Entity()
export class Document extends BaseEntity{

    @Column()
    type: string;

    @Column()
    page_count: number;

    @ManyToOne(type => AcademicPeriod, period => period.documents)
    academicPeriod: AcademicPeriod;

    @ManyToOne(type => Course, course => course.documents)
    course: Course;

    @ManyToOne(type => Lecturer, lecturer => lecturer.documents)
    lecturer: Lecturer;

    constructor(name: string, title: string, type: string, page_count: number,
      course: Course, lecturer: Lecturer, academicPeriod: AcademicPeriod){
        super(name, title);
        this.type = type;
        this.page_count = page_count;
        this.course = course;
        this.lecturer = lecturer;
        this.academicPeriod = academicPeriod;
      }
}