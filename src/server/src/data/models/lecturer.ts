import { Column, Entity, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import Department from './department';
import Document from './document';
import { BaseEntity } from './entity';


@Entity()
@Unique(['title', 'firstName', 'lastName'])
export default class Lecturer extends BaseEntity {

  @Column({ type: 'varchar', length: 50, nullable: true })
  title: string;

  @Column({ type: 'varchar', name: 'first_name', length: 50, nullable: false })
  firstName: string;

  @Column({ type: 'varchar', name: 'last_name', length: 50, nullable: true })
  lastName: string;

  // TODO: use enum
  @Column({ type: 'varchar', nullable: false })
  gender: string;

  @ManyToOne(type => Department, department => department.lecturers)
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @OneToMany(type => Document, document => document.lecturer)
  documents: Document[];

}
