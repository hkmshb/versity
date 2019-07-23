import 'reflect-metadata';
import {createConnection, Connection} from 'typeorm';
import {School, Department, Programme, Course} from './internals';
export {School, Department, Programme, Course} from './internals';



export async function createDbConnection(connection_url: string): Promise<Connection>{
  return await createConnection(
    {
      type: "sqlite",
      database: connection_url,
      synchronize: true,
      logging: false,
      entities: [
        School,
        Department,
        Programme,
        Course
      ]
    }
  );
}