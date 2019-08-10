import * as fs from 'fs';
import { Connection, createConnection, DeepPartial, getConnection, ObjectType } from 'typeorm';
import { models } from '../src/data';


export const getTestDbConnection = async (name: string = 'test-db'): Promise<Connection> => {
  try {
    return getConnection(name);
  } catch (err) {
    return createConnection({
      name,
      type: 'sqlite',
      database: ':memory:',
      logging: false,
      synchronize: true,
      entities: Object.values(models)
    });
  }
};


/**
 * Loads a collection of predefined, valid test data for entities defined in the
 * system with the relationship between these entities modelled.
 */
export const loadDbFixtures = async (loader: FixtureLoader = null) => {
  const conn = await getTestDbConnection();
  loader = loader || new FixtureLoader(conn);

  const promises = [];
  conn.entityMetadatas.forEach(entity => {
    const fixtureFile = `${__dirname}/fixtures/${entity.name.toLowerCase()}.json`;
    if (!fs.existsSync(fixtureFile)) return;

    const items = JSON.parse(fs.readFileSync(fixtureFile, 'utf8'));
    items.forEach(item => {
      const loaderFunc = loader[`load${entity.name}`];
      if (loaderFunc) {
        promises.push(loaderFunc.bind(loader)(item));
      }
    });
  });

  return Promise
    .all(promises)
    .then(res => true)
    .catch(err => {
      console.log(`error [load fixture] : ${err}`);
      return false;
    });
};


export class FixtureLoader {
  conn: Connection;

  constructor(conn: Connection) {
    this.conn = conn;
  }

  clear(): void {
    this.conn.entityMetadatas.forEach(entity => {
      const repo = this.conn.getRepository(entity.name);
      repo.clear();
    });
  }

  async load<T extends any>(entity: ObjectType<T>, args: DeepPartial<T>): Promise<T> {
    const repo = this.conn.getRepository(entity.name);
    const instance = repo.create(args) as T;
    return repo.save(instance);
  }

  async loadSchool(values): Promise<models.School> {
    const { children, ...args } = values;
    const savedSchool = await this.load(models.School, args);
    if (children) {
      for (const child of children) {
        await this.loadSchool({ ...child, parent: savedSchool});
      }
    }

    return savedSchool;
  }
}
