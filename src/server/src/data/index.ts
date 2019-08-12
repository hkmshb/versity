import { Connection, ObjectType } from 'typeorm';
import * as models from './models';
import * as repos from './repository';
import { IRepository } from './repository/school';


declare module 'typeorm' {
  // tslint:disable:interface-name
  interface Connection {
    findRepository<T>(model: ObjectType<T>): IRepository<T>;
  }
}

// tslint:disable:only-arrow-functions
Connection.prototype.findRepository = function<T>(model: ObjectType<T>): IRepository<T> {
  // finder provides access to the connection instance, not possible otherwise see
  // https://stackoverflow.com/questions/4700880/this-in-function-inside-prototype-function
  const finder = (): IRepository<T> => {
    const repoName = `${model.name}Repository`;
    const repoType = repos[repoName];
    if (!repoType) {
      throw new Error(`Custom repository not found: ${repoName}`);
    }

    return this.getCustomRepository(repoType);
  };

  return finder();
};


export {
  Connection,
  models,
  repos
};
