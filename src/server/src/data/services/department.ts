import { readFileSync } from 'fs';
import { parse } from 'papaparse';
import { EntityRepository, FindOneOptions, Repository } from 'typeorm';
import { number, ObjectSchema, ValidationError } from 'yup';
import { AcademicSection, Department } from '../models';
import { DepartmentData, DepartmentSchema, RequiredIdSchema } from '../schemas';
import { EntityService } from '../types';


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
    // perform schema validation
    const data: DepartmentData = schema.validateSync(values);
    let academicSection: AcademicSection = null;

    if (!values.id && !data.academicSectionId) { // neither a create nor update command
      throw new ValidationError(`Academic Section not specified: ${data}`, 'data', 'academicSectionId');
    }

    // check if academic section for department exists and academic section is a faculty
    if (data.academicSectionId) {
      const asRepo = this.getRepositoryFor(AcademicSection); // academic section Repository
      academicSection = await asRepo.findOne(data.academicSectionId, {relations: ['parent']});
      if (!academicSection) {
        throw new ValidationError(
          `Academic section for department not found: ${data.academicSectionId}`, data, 'academicSectionId'
        );
      }
      // check if the academic section is a school
      if (!academicSection.parent) {
        throw new ValidationError(
          `Academic section is a school and not a faculty: ${data.academicSectionId}`, data, 'academicSectionId'
        );
      }
      data.academicSection = academicSection;
    }

    // more business logic validations
    let whereCondition: string = 'department.name = :name';

    if (values.id) {
      whereCondition = `(${whereCondition}) AND (department.id != :id)`;
    }

    const repository = this.getRepository();
    const found = await repository
      .createQueryBuilder(Department.name)
      .leftJoinAndSelect(`${Department.name}.academicSection`, 'academicSection')
      .where(whereCondition, data)
      .getMany()
      .then(departments => {
        if (!data.academicSectionId) {
          return departments[0];
        }
        return departments.filter(
          d => d.academicSection && (d.academicSection.id === data.academicSectionId)
        )[0];
      });

    if (found) {
      throw new ValidationError(`name ${values.name} already in use`, data, `name`);
    }

    return data;
  }
}
