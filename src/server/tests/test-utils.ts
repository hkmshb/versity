import * as fs from 'fs';
import {
  Connection,
  createConnection,
  DeepPartial,
  EntityMetadata,
  getConnection,
  ObjectType
} from 'typeorm';
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
export const loadValidEntityFixtures = async (loader: FixtureLoader = null) => {
  const conn = await getTestDbConnection();
  loader = loader || new FixtureLoader(conn);

  const promises = [];
  loader.loadOrder.forEach(entity => {
    const fname = entity.tableName.replace('_', '-').toLowerCase();
    const fixtureFile = `${__dirname}/fixtures/valid-entity-docs/${fname}.json`;
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
  loadOrder: EntityMetadata[];

  constructor(conn: Connection) {
    this.conn = conn;
    this.loadOrder = [];

    const loadOrder = [
      models.School.name,
      models.AcademicPeriod.name,
    ];

    const entities = [...conn.entityMetadatas];
    loadOrder.forEach(name => {
      const item = entities.filter(e => e.name === name);
      if (item) this.loadOrder.push(item[0]);
    });
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
    return await repo.save(instance);
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

  async loadAcademicPeriod(values): Promise<models.AcademicPeriod> {
    let schoolInstance = null;
    const { children, school, ...args } = values;
    if (school) { // && !schoolInstance) {
      if (typeof school === 'string' && school.startsWith('$ref:')) {
        const repo = this.conn.getRepository(models.School);
        const [ field, value ] = school.substring(5).trim().split('=');

        // HACK:
        // findOne had to be called twice in order to retrieve existing record :shrug:
        schoolInstance = await repo.findOne({[field]: value});
        schoolInstance = await repo.findOne({[field]: value});
      } else {
        schoolInstance = await this.loadSchool(school);
      }

      if (!schoolInstance) throw new Error(`School not found: ${school}`);
    }

    const savedPeriod = await this.load(models.AcademicPeriod, {...args, school: schoolInstance});
    if (children) {
      for (const child of children) {
        await this.loadAcademicPeriod({ ...child, parent: savedPeriod });
      }
    }
    // console.log(JSON.stringify(savedPeriod, null, 2));
    return savedPeriod;
  }
}
