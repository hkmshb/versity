import {Column, Entity, ManyToOne, OneToMany} from 'typeorm';
import {AcademicPeriod, BaseEntity, Department} from './internals';


@Entity()
export class School extends BaseEntity {

  @Column()
  addrStreet: string;

  @Column()
  addrTown: string;

  @Column()
  addrState: string;

  @ManyToOne(type => School, school => school.children)
  parent: School;

  @OneToMany(type => School, school => school.parent)
  children: School[];

  @OneToMany(type => Department, department => department.faculty)
  departments: Department[];

  @OneToMany(type => AcademicPeriod, period => period.school)
  academicPeriods: AcademicPeriod[];

  constructor(name: string, title: string, addrStreet: string, addrState: string,
              addrTown: string) {
    super(name, title);
    this.addrState = addrState;
    this.addrStreet = addrStreet;
    this.addrTown = addrTown;
  }
}
