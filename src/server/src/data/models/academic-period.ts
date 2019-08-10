import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import Document from './document';
import NamedEntity from './entity';
import School from './school';


@Entity()
export default class AcademicPeriod extends NamedEntity {

  @Column({ name: 'date_begin', nullable: true })
  dateBegin: Date;

  @Column({ name: 'date_end', nullable: true })
  dateEnd: Date;

  @ManyToOne(type => AcademicPeriod, period => period.children)
  @JoinColumn({ name: 'parent_id' })
  parent: AcademicPeriod;

  @OneToMany(type => AcademicPeriod, period => period.parent)
  children: AcademicPeriod[];

  @OneToMany(type => Document, document => document.academicPeriod)
  documents: Document[];

  @ManyToOne(type => School, school => school.academicPeriods)
  @JoinColumn({ name: 'school_id' })
  school: School;

}
