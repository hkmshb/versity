import {Column, Entity, ManyToOne, OneToMany} from 'typeorm';
import {AcademicPeriod, BaseEntity, Course, Lecturer} from './internals';


@Entity()
export class Document extends BaseEntity {

  @Column()
  type: string;

  @Column()
  pageCount: number;

  @ManyToOne(type => AcademicPeriod, period => period.documents)
  academicPeriod: AcademicPeriod;

  @ManyToOne(type => Course, course => course.documents)
  course: Course;

  @ManyToOne(type => Lecturer, lecturer => lecturer.documents)
  lecturer: Lecturer;

  constructor(name: string, title: string, type: string, pageCount: number,
              course: Course, lecturer: Lecturer, academicPeriod: AcademicPeriod) {
    super(name, title);
    this.type = type;
    this.course = course;
    this.lecturer = lecturer;
    this.pageCount = pageCount;
    this.academicPeriod = academicPeriod;
  }
}
