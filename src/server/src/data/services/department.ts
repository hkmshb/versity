import { EntityRepository, FindOneOptions, Repository } from 'typeorm';
import { ObjectSchema, ValidationError, number } from 'yup';
import { Department, AcademicSection } from '../models';
import { DepartmentData, DepartmentSchema, RequiredIdSchema } from '../schemas';
import { EntityService } from '../types';
import { parse } from 'papaparse';
import { readFileSync } from 'fs';


@EntityRepository(Department)
export default class DepartmentService extends EntityService<Department, DepartmentData> {

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
      throw new ValidationError(`Department not found for ${departmentId}`, values, 'id');
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
    //let count = 0;
    let results = parse(file, {header: true}).data;
    return await this.manager.transaction<number>(async transactionalEntityManager => {
      let count = 0
      results.forEach(async (department:Department, lineNumber:number, array: any[]) => {
        const data = await this.validate(DepartmentSchema, department);
        if(!data){
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
    // perform schema validation
    const data: DepartmentData = schema.validateSync(values);

    // more business logic validations
    let whereCondition: string = 'department.name = :name';

    if (values.id) {
      whereCondition = `(${whereCondition}) AND (department.id != :id)`;
    }

    const repository = this.getRepository();
    const found = await repository
      .createQueryBuilder(Department.name)
      .where(whereCondition, data)
      .getOne();

    if (found) {
      throw new ValidationError(`name ${values["name"]} already in use`, data, `name`);
    }

    // check school if schoolId is given
    if (data.schoolId) {
      const schoolRepository = this.getRepositoryFor(AcademicSection);
      const school = await schoolRepository.findOne(data.schoolId, {relations: ['parent']});
      if (!school) {
        throw new ValidationError(`Parent school for department not found: ${data.schoolId}`, data, 'schoolId');
      }

      data.school = school;
    }

    return data;
  }
}
