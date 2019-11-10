import fs from 'fs';
import _ from 'lodash';
import { EntityManager, EntityRepository, FindOneOptions, Repository } from 'typeorm';
import xlsx from 'xlsx';
import { number, ObjectSchema, ValidationError as YupError } from 'yup';
import { Dictionary } from '../../types';
import { logger } from '../../utils';
import { AcademicSection, Department } from '../models';
import { DepartmentData, DepartmentSchema, RequiredIdSchema } from '../schemas';
import { DataImportError, EntityError, EntityService, ValidationError } from '../types';
import {
  DepartmentUniquenessValidator,
  OperationTypeValidator,
  ReferenceAcademicSectionValidator
} from '../validators/department';


@EntityRepository(Department)
export default class DepartmentService extends EntityService<Department, DepartmentData> {

  constructor(manager: EntityManager) {
    super(manager);
    this.prevalidators.push(new OperationTypeValidator(this.manager));
    this.validators.push(new ReferenceAcademicSectionValidator(this.manager));
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
  async importData(filepath: string): Promise<number> {
    logger.debug('starting department data import...');
    if (!fs.existsSync(filepath)) {
      throw new DataImportError(`File not found: ${filepath}`);
    }

    let rows: DepartmentData[] = [];
    try {
      logger.debug('reading data file ...');
      const workbook = xlsx.readFile(filepath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rows = xlsx.utils.sheet_to_json(sheet);
    } catch (err) {
      const errorMessage = `File processing failed: ${err}`;
      logger.error(errorMessage);
      throw new DataImportError(errorMessage);
    }

    logger.debug('starting transaction for saving records ...');
    return this.manager.transaction(async trans => {
      let index = 0;
      for (const row of rows) {
        index += 1;
        try {
          const data = await this.validate(DepartmentSchema, row);
          const instance = trans.create(Department, data);
          await trans.save(instance);
        } catch (err) {
          logger.error(err.toString());
          if (err.path) {
            throw new DataImportError({[err.path]: err.errors}, index);
          }
          throw new DataImportError(err.errors || err.message, index);
        }
      }
      return rows.length;
    });
  }


  /**
   * Finds and returns a persisted Department object from storage.
   */
  findByIdent(ident?: string | number, options?: FindOneOptions<Department>): Promise<Department> {
    let whereClause: Dictionary[] | null = null;
    if (typeof ident === 'string' && ident.startsWith('$ref:')) {
      const [field, value] = ident.substr(5).split('=');
      whereClause = [{[field]: value}];
    }

    return this
      .getRepositoryFor(Department)
      .findOne({
        ...options,
        where: whereClause || [{id: ident}, {uuid: ident}]
      })
      .then(department => {
        if (!department) {
          throw new Error(`Department period not found for '${ident}'`);
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
