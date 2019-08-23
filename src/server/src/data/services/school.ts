import { EntityRepository, FindOneOptions, Repository } from 'typeorm';
import { ObjectSchema, ValidationError } from 'yup';
import { School } from '../models';
import { RequiredIdSchema, SchoolData, SchoolSchema } from '../schemas';
import { EntityService } from '../types';


@EntityRepository(School)
export default class SchoolService extends EntityService<School, SchoolData> {

  /**
   * Creates a School object from provided arguments and persists the object to storage.
   */
  async createAndSave(values: SchoolData): Promise<School> {
    // validate against schema
    const data = await this.validate(SchoolSchema, values);
    const instance = this.manager.create(School, data);
    return this.manager.save(instance);
  }

  /**
   * Updates an existing entity.
   */
  async updateAndSave(values: SchoolData): Promise<School> {
    const schoolId = RequiredIdSchema.validateSync(values);
    const school = this.getRepositoryFor(School)
      .findOne(schoolId, {relations: ['parent', 'children']});

    if (!school) {
      throw new ValidationError(`School not found for ${schoolId}`, values, 'id');
    }

    const data = await this.validate(SchoolSchema, values);
    const instance = this.manager.create(School, {...school, ...data});
    return this.manager.save(instance);
  }

  /**
   * Finds and returns a persisted School object from storage.
   */
  findByIdent(ident?: string | number, options?: FindOneOptions<School>): Promise<School> {
    return this.getRepositoryFor(School)
      .createQueryBuilder(School.name)
      .where('id = :ident OR code = :ident OR uuid = :ident', {ident})
      .getOne()
      .then(school => {
        if (!school) {
          throw new Error(`School not found for '${ident}'`);
        }
        return school;
      });
  }

  /**
   * Returns the ORM repository for managing School entities.
   */
  getRepository(): Repository<School> {
    return this.getRepositoryFor(School);
  }

  private async validate(schema: ObjectSchema, values: SchoolData): Promise<SchoolData> {
    // perform schema validation
    const data: SchoolData = schema.validateSync(values);

    // more business logic validations
    let whereCondition: string = [
      'school.name = :name',
      'school.code = :code',
      'school.nickname = :nickname'
    ].join(' OR ');

    if (values.id) {
      whereCondition = `(${whereCondition}) AND (school.id != :id)`;
    }

    const repository = this.getRepository();
    const found = await repository
      .createQueryBuilder(School.name)
      .where(whereCondition, data)
      .getOne();

    if (found) {
      const fieldName = (found.name === data.name
          ? 'name' : (found.code === data.code
            ? 'code' : 'nickname'));

      throw new ValidationError(`${fieldName} already in use`, data, `${fieldName}`);
    }

    // check parent object if parentId is given
    if (data.parentId) {
      const parent = await repository.findOne(data.parentId, {relations: ['parent']});
      if (!parent) {
        throw new ValidationError(`Parent school not found: ${data.parent}`, data, 'parentId');
      } else if (parent.parent) {
        // only single hierarchy level is allowed; thus parent mustn't have a parent
        throw new ValidationError('School hierarchical relationships cannot exceed 1 level', data, 'parent');
      }

      data.parent = parent;
    }

    return data;
  }
}
