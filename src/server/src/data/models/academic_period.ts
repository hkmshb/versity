import {Column, Entity, ManyToOne, OneToMany} from 'typeorm';
import {BaseEntity, Document, School} from './internals';


@Entity()
export class AcademicPeriod extends BaseEntity {

  @Column()
  dateBegin: Date;

  @Column()
  dateEnd: Date;

  @ManyToOne(type => AcademicPeriod, period => period.children)
  parent: AcademicPeriod;

  @OneToMany(type => AcademicPeriod, period => period.parent)
  children: AcademicPeriod[];

  @OneToMany(type => Document, document => document.academicPeriod)
  documents: Document[];

  @ManyToOne(type => School, school => school.academicPeriods)
  school: School;

  constructor(name: string, title: string, dateBegin: Date, dateEnd: Date,
              school: School) {
    super(name, title);
    this.dateBegin = dateBegin;
    this.dateEnd = dateEnd;
    this.school = school;
  }
}
