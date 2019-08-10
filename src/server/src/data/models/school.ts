import { Column, Entity, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import AcademicPeriod from './academic-period';
import Department from './department';
import { BaseEntity } from './entity';


@Entity()
@Unique(['parent', 'code'])
@Unique(['parent', 'name'])
export default class School extends BaseEntity {

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  code: string;

  @Column({ type: 'varchar', length: 15, unique: true, nullable: false })
  nickname: string;

  @Column({ name: 'addr_street', type: 'varchar', nullable: true })
  addrStreet: string;

  @Column({ name: 'addr_state', type: 'varchar', length: 50, nullable: true })
  addrState: string;

  @Column({ name: 'addr_town', type: 'varchar', length: 50, nullable: true })
  addrTown: string;

  @ManyToOne(type => School, school => school.children)
  @JoinColumn({ name: 'parent_id' })
  parent: School;

  @OneToMany(type => School, school => school.parent)
  children: School[];

  @OneToMany(type => Department, department => department.school)
  departments: Department[];

  @OneToMany(type => AcademicPeriod, period => period.school)
  academicPeriods: AcademicPeriod[];

}
