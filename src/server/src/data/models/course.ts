import {Column, Entity, ManyToOne, OneToMany} from 'typeorm';
import {BaseEntity, Document, Programme} from './internals';


@Entity()
export class Course extends BaseEntity {

  @Column()
  code: string;

  @Column()
  unit: number;

  @Column()
  level: number;

  @ManyToOne(type => Programme, programme => programme.courses)
  programme: Programme;

  @OneToMany(type => Document, document => document.course)
  documents: Document[];

  constructor(name: string, title: string, code: string, unit: number,
              level: number, programme: Programme) {
    super(name, title);
    this.code = code;
    this.unit = unit;
    this.level = level;
    this.programme = programme;
  }
}
