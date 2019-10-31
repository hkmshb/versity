import { readFileSync } from 'fs';
import _ from 'lodash';
import { parse } from 'papaparse';
import { EntityManager, EntityRepository, FindOneOptions, Repository } from 'typeorm';
import { number, ObjectSchema, ValidationError as YupError } from 'yup';
import { AcademicSection, Department } from '../models';
import { DepartmentData, DepartmentSchema, RequiredIdSchema } from '../schemas';
import { DataImportError, EntityError, EntityService, ValidationError } from '../types';
import {
  DepartmentParentAcademicSectionValidator,
  DepartmentUniquenessValidator,
  OperationTypeValidator
} from '../validators/department';


@EntityRepository(Department)
export default class DepartmentService extends EntityService<Department, DepartmentData> {

  constructor(manager: EntityManager) {
    super(manager);
    this.prevalidators.push(new OperationTypeValidator(this.manager));
    this.validators.push(new DepartmentParentAcademicSectionValidator(this.manager));
    this.validators.push(new DepartmentUniquenessValidator(this.manager));
  }

  /**
   * Creates a Department object from provided arguments and persists the object to storage.
   */
  async createAndSave(values: DepartmentData): Promise<Department> {
    // validate against schema
    const data = await this.validate(DepartmentSchema, values);
    const instance = this.manager.create(Department, data);
    return this.manager.save(instance);
  }

  /**
   * Updates an existing entity.
   */
  async updateAndSave(values: DepartmentData): Promise<Department> {
    const departmentId = RequiredIdSchema.validateSync(values);
    const department = this.getRepositoryFor(Department)
      .findOne(departmentId);

    if (!department) {
      throw new YupError(`Department not found for ${departmentId}`, values, 'id');
    }

    const data = await this.validate(DepartmentSchema, values);
    const instance = this.manager.create(Department, {...department, ...data});
    return this.manager.save(instance);
  }

  /**
   * Imports departments from file
   */
  async importRecords(filepath: string): Promise<number> {
    const file = readFileSync(filepath, 'utf8');
    // let count = 0;
    const results = parse(file, {header: true}).data;
    return await this.manager.transaction<number>(async transactionalEntityManager => {
      let count = 0;
      results.forEach(async (department: Department, lineNumber: number, array: any[]) => {
        const data = await this.validate(DepartmentSchema, department);
        if (!data) {
          throw new Error(`Invalid department data on line ${lineNumber + 1}`);
        }
        const instance = transactionalEntityManager.create(Department, data);
        transactionalEntityManager.save(instance);
        count++;
      });
      return count;
    });
  }

  /**
   * Finds and returns a persisted Department object from storage.
   */
  findByIdent(ident?: string | number, options?: FindOneOptions<Department>): Promise<Department> {
    return this.getRepositoryFor(Department)
      .createQueryBuilder(Department.name)
      .where('id = :ident OR uuid = :ident', {ident})
      .getOne()
      .then(department => {
        if (!department) {
          throw new Error(`Department not found for '${ident}'`);
        }
        return department;
      });
  }

  /**
   * Returns the ORM repository for managing Department entities.
   */
  getRepository(): Repository<Department> {
    return this.getRepositoryFor(Department);
  }

  private async validate(schema: ObjectSchema, values: DepartmentData): Promise<DepartmentData> {
    const errors: EntityError<DepartmentData> = {};

    // perform pre-validations (needs to be synchronous)
    for (const validator of this.prevalidators) {
      values = await validator.check(values, errors);
      if (!_.isEmpty(errors)) {
        throw new ValidationError(errors);
      }
    }

    // perform schema validation & other post validations
    return schema.validate(values)
      .then(data => {
        const promises = [];
        this.validators.forEach(validator => (
          promises.push(validator.check(data, errors))
        ));

        return Promise.all(promises).then(results => {
          if (Object.keys(errors).length > 0) {
            throw new ValidationError(errors);
          }
          return data;
        });
      })
      .catch(err => {
        if (err.path) {
          err = new ValidationError({[err.path]: err.errors});
        }
        throw err;
      });
  }
}
