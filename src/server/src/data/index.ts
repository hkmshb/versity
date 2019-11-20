import {
  Connection,
  ConnectionOptions,
  createConnection,
  getConnection,
  ObjectType
} from 'typeorm';
import * as conf from '../config';
import { logger } from '../utils';
import * as models from './models';
import * as repos from './services';
import { EntityService } from './types';


declare module 'typeorm' {
  // tslint:disable:interface-name
  interface Connection {
    findEntityServiceFor<T>(entity: ObjectType<T>): EntityService<T, any>;
  }
}


// tslint:disable:only-arrow-functions
Connection.prototype.findEntityServiceFor = function<T>(entity: ObjectType<T>): EntityService<T, any> {
  // finder provides access to the connection instance, not possible otherwise see
  // https://stackoverflow.com/questions/4700880/this-in-function-inside-prototype-function
  const finder = (): EntityService<T, any> => {
    const serviceName = `${entity.name}Service`;
    const serviceType = repos[serviceName];
    if (!serviceType) {
      throw new Error(`Service for custom repository not found: ${serviceName}`);
    }
    return this.getCustomRepository(serviceType);
  };

  return finder();
};


export const getDbConnection = async (connectionName?: string): Promise<Connection> => {
  let conn: Connection = null;

  try {
    conn = getConnection(connectionName);
  } catch (err) {
    logger.error(`failed to get connection: ${connectionName}`);
  }

  if (!conn) {
    conn = await initDbConnection({
      name: connectionName,
      synchronize: conf.IS_TEST_ENV
    });
  }

  return conn;
};


export const initDbConnection = (options?: Partial<ConnectionOptions>): Promise<Connection> => {
  // pull and use existing env var values
  const { protocol, username, password, host, port, pathname} = conf.DATABASE_URL;
  const targetOptions = {
    // configured database url
    host,
    port,
    password,
    username,
    type: protocol.slice(0, -1),
    database: pathname.substring(1),
    // default options
    logging: false,
    synchronize: false,
    entities: Object.values(models),
    // code overrides
    ...options
  };
  return createConnection(targetOptions as ConnectionOptions);
};


export {
  Connection,
  models,
  repos
};
