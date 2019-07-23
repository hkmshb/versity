import {BaseEntity, Department} from './internals';
import {Entity, Column, OneToMany, ManyToOne} from 'typeorm';


@Entity()
export class School extends BaseEntity{

    @Column()
    addr_street: string;

    @Column()
    addr_town: string;

    @Column()
    addr_state: string;

    @ManyToOne(type => School, school => school.children)
    parent: School;

    @OneToMany(type=> School, school => school.parent)
    children: School[];

    @OneToMany(type=> Department, department => department.faculty)
    departments: Department[];

    constructor(name: string, title: string, addr_street: string, addr_state: string,
      addr_town: string){
        super(name, title);
        this.addr_state = addr_state;
        this.addr_street = addr_street;
        this.addr_town = addr_town;
      }
}