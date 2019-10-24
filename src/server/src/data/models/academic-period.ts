import { Check, Column, Entity, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import AcademicSection from './academic-section';
import Document from './document';
import { BaseEntity } from './entity';


@Entity()
@Unique(['academicSection', 'parent', 'name'])
@Unique(['academicSection', 'parent', 'code'])
@Check(`"academicSectionId" IS NOT NULL OR "academicSectionId" != 0`)
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

  @ManyToOne(type => AcademicSection, section => section.academicPeriods)
  @JoinColumn({ name: 'academic_section_id' })
  academicSection: AcademicSection;

  @OneToMany(type => Document, document => document.academicPeriod)
  documents: Document[];

}
