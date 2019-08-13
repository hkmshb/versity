import { Connection, ObjectType } from 'typeorm';
import * as models from './models';
import * as repos from './services';
import { EntityService } from './types';


declare module 'typeorm' {
  // tslint:disable:interface-name
  interface Connection {
    findEntityServiceFor<T>(entity: ObjectType<T>): EntityService<T>;
  }
}

// tslint:disable:only-arrow-functions
Connection.prototype.findEntityServiceFor = function<T>(entity: ObjectType<T>): EntityService<T> {
  // finder provides access to the connection instance, not possible otherwise see
  // https://stackoverflow.com/questions/4700880/this-in-function-inside-prototype-function
  const finder = (): EntityService<T> => {
    const serviceName = `${entity.name}Service`;
    const serviceType = repos[serviceName];
    if (!serviceType) {
      throw new Error(`Service for custom repository not found: ${serviceName}`);
    }

    return this.getCustomRepository(serviceType);
  };

  return finder();
};


export {
  Connection,
  models,
  repos
};
