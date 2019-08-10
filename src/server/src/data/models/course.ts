import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import Document from './document';
import NamedEntity from './entity';
import Programme from './programme';


@Entity()
export default class Course extends NamedEntity {

  @Column({ length: 15, unique: true })
  code: string;

  @Column()
  unit: number;

  @Column()
  level: number;

  @ManyToOne(type => Programme, programme => programme.courses)
  @JoinColumn({ name: 'programme_id' })
  programme: Programme;

  @OneToMany(type => Document, document => document.course)
  documents: Document[];

}
