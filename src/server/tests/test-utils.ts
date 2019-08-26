import * as fs from 'fs';
import {
  createConnection,
  EntityMetadata,
  getConnection,
  ObjectType
} from 'typeorm';
import { Connection, models } from '../src/data';


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

  try {
    for (const entity of loader.loadOrder) {
      const fname = entity.tableName.replace('_', '-').toLowerCase();
      const fixtureFile = `${__dirname}/fixtures/valid-entity-docs/${fname}.json`;
      if (!fs.existsSync(fixtureFile)) continue;

      const items = JSON.parse(fs.readFileSync(fixtureFile, 'utf8'));
      const loaderFunc = loader[`load${entity.name}`];
      if (loaderFunc) {
        for (const item of items) {
          await loaderFunc.bind(loader)(item);
        }
      }
    }
    return true;
  } catch (err) {
    console.log(`error [load fixtures] : ${err}`);
  }
  return false;
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
      models.Department.name,
      models.Programme.name,
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

  async load<T extends any>(entity: ObjectType<T>, args: Partial<T>): Promise<T> {
    try {
      const service = this.conn.findEntityServiceFor(entity);
      return await service.createAndSave(args);
    } catch (err) {
      // console.log(`type: ${entity.name} error: ${JSON.stringify(err, null, 2)}`);
      const repository = this.conn.getRepository(entity);
      const instance = repository.create(args) as T;
      return await repository.save(instance);
    }
  }

  async loadSchool(values): Promise<models.School> {
    const { children, ...args } = values;
    const savedSchool = await this.load(models.School, args);
    if (children) {
      for (const child of children) {
        await this.loadSchool({ ...child, parentId: savedSchool.id });
      }
    }
    return savedSchool;
  }

  async loadAcademicPeriod(values): Promise<models.AcademicPeriod> {
    const { children, school, ...args } = values;
    const schoolInstance = await this.findSchool(school);
    const savedPeriod = await this.load(models.AcademicPeriod, {...args, school: schoolInstance});
    if (children) {
      for (const child of children) {
        await this.loadAcademicPeriod({ ...child, parent: savedPeriod });
      }
    }
    // console.log(JSON.stringify(savedPeriod, null, 2));
    return savedPeriod;
  }

  async loadDepartment(values): Promise<models.Department> {
    const { programmes, school, ...args } = values;
    const schoolInstance = await this.findSchool(school);
    const savedDept = await this.load(models.Department, { ...args, school: schoolInstance });

    if (programmes) {
      programmes.forEach(prog => (
        this.loadProgramme({...prog, department: savedDept})
      ));
    }
    return savedDept;
  }

  async loadProgramme(values): Promise<models.Programme> {
    const { courses, dept, ...args } = values;
    const deptInstance = await this.findDept(dept);
    const savedProgramme = await this.load(models.Programme, { ...args, department: deptInstance });

    if (courses) {
      courses.array.forEach(course => (
        this.loadCourse({...course, programme: savedProgramme})
      ));
    }
    return savedProgramme;
  }

  async loadCourse(values): Promise<models.Course> {
    return null;
  }

  async findSchool(schoolRef): Promise<models.School> {
    let school: models.School = null;
    if (schoolRef) {
      if (typeof schoolRef === 'string' && schoolRef.startsWith('$ref:')) {
        const repo = this.conn.getRepository(models.School);
        const [ field, value ] = schoolRef.substring(5).trim().split('=');
        const condition = {[field]: value};
        school = await repo.findOne(condition);
      } else {
        school = await this.loadSchool(schoolRef);
      }

      if (!school) throw new Error(`School not found: ${schoolRef}`);
    }
    return school;
  }

  async findDept(deptRef): Promise<models.Department> {
    let dept: models.Department = null;
    if (deptRef) {
      if (typeof deptRef === 'string' && deptRef.startsWith('$ref:')) {
        const repo = this.conn.getRepository(models.Department);
        const [ field, value ] = deptRef.substring(5).trim().split('=');

        dept = await repo.findOne({[field]: value});
      } else {
        dept = await this.loadDepartment(deptRef);
      }

      if (!dept) throw new Error(`Department not found: ${deptRef}`);
    }
    return dept;
  }
}
