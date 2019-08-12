import { Check, Column, Entity, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import Document from './document';
import { BaseEntity } from './entity';
import School from './school';


@Entity()
@Check(`"school_id" IS NOT NULL OR "school_id" != 0`)
@Unique(['school', 'parent', 'name'])
export default class AcademicPeriod extends BaseEntity {

  @Column({ type: 'varchar', nullable: false })
  name: string;

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
