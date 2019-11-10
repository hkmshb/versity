import { Column, Entity, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import AcademicSection from './academic-section';
import {BaseEntity} from './entity';
import Lecturer from './lecturer';
import Programme from './programme';


@Entity()
@Unique(['academicSection', 'name'])
export default class Department extends BaseEntity {

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @ManyToOne(type => AcademicSection, section => section.departments)
  @JoinColumn({ name: 'academic_section_id' })
  academicSection: AcademicSection;

  @OneToMany(type => Programme, programme => programme.department)
  programmes: Programme[];

  @OneToMany(type => Lecturer, lecturer => lecturer.department)
  lecturers: Lecturer[];

}
