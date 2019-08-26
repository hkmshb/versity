import { Check, Column, Entity, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import School from './academic-section';
import Document from './document';
import { BaseEntity } from './entity';


@Entity()
@Check(`"school_id" IS NOT NULL OR "school_id" != 0`)
@Unique(['school', 'parent', 'name'])
@Unique(['school', 'parent', 'code'])
export default class AcademicPeriod extends BaseEntity {

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'varchar', nullable: false })
  code: string;

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
