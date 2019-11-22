import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import AcademicPeriod from './academic-period';
import Course from './course';
import NamedEntity from './entity';
import Lecturer from './lecturer';


@Entity()
export default class Document extends NamedEntity {

  // TODO: use enum
  @Column('varchar')
  type: string;

  @Column({ type: 'integer', name: 'page_count' })
  pageCount: number;

  @ManyToOne(type => AcademicPeriod, period => period.documents)
  @JoinColumn({ name: 'academic_period_id' })
  academicPeriod: AcademicPeriod;

  @ManyToOne(type => Course, course => course.documents)
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @ManyToOne(type => Lecturer, lecturer => lecturer.documents)
  @JoinColumn({ name: 'lecturer_id' })
  lecturer: Lecturer;

}
