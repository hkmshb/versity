import 'reflect-metadata';
import {Connection, createConnection} from 'typeorm';
import {AcademicPeriod, Course, Department, Document, Lecturer, Programme, School} from './internals';
export {School, Department, Programme, Course, Lecturer, AcademicPeriod, Document} from './internals';


export async function createDbConnection(connectionUrl: string): Promise<Connection> {
  return await createConnection({
    type: 'sqlite',
    database: connectionUrl,
    synchronize: true,
    logging: false,
    entities: [
      School,
      Department,
      Programme,
      Course,
      Lecturer,
      AcademicPeriod,
      Document
    ]
  });
}
