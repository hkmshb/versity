import { ObjectType } from 'typeorm';
import { getDbConnection } from '../data';
import { EntityService } from '../data/types';


export abstract class BaseController {
  findService = <T>(entity: ObjectType<T>): Promise<EntityService<T, any>> => {
    return getDbConnection()
      .then(conn => (
        conn.findEntityServiceFor(entity)
      ));
  }
}
