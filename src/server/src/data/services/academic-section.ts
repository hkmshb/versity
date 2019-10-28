import { EntityRepository, FindOneOptions, Repository } from 'typeorm';
import { ObjectSchema, ValidationError } from 'yup';
import { AcademicSection } from '../models';
import { AcademicSectionData, AcademicSectionSchema, RequiredIdSchema } from '../schemas';
import { EntityService } from '../types';


@EntityRepository(AcademicSection)
export default class AcademicSectionService extends EntityService<AcademicSection, AcademicSectionData> {

  /**
   * Creates a Academic section object from provided arguments and persists the object to storage.
   */
  async createAndSave(values: AcademicSectionData): Promise<AcademicSection> {
    // validate against schema
    const data = await this.validate(AcademicSectionSchema, values);
    const instance = this.manager.create(AcademicSection, data);
    return this.manager.save(instance);
  }

  /**
   * Updates an existing entity.
   */
  async updateAndSave(values: AcademicSectionData): Promise<AcademicSection> {
    const sectionId = RequiredIdSchema.validateSync(values);
    const section = this.getRepositoryFor(AcademicSection)
      .findOne(sectionId, {relations: ['parent', 'children']});

    if (!section) {
      throw new ValidationError(`Academic section not found for ${sectionId}`, values, 'id');
    }

    const data = await this.validate(AcademicSectionSchema, values);
    const instance = this.manager.create(AcademicSection, {...section, ...data});
    return this.manager.save(instance);
  }

  /**
   * Finds and returns a persisted Academic section object from storage.
   */
  findByIdent(ident?: number | string, options?: FindOneOptions<AcademicSection>): Promise<AcademicSection> {
    return this.getRepositoryFor(AcademicSection)
      .findOne({
        ...options,
        where: [{id: ident}, {uuid: ident}, {code: ident}],
        relations: [...((options && options.relations) || []), 'parent']
      })
      .then(section => {
        if (!section) {
          throw new Error(`Academic section not found for '${ident}'`);
        }
        return section;
      });
  }

  /**
   * Returns the ORM repository for managing Academic section entities.
   */
  getRepository(): Repository<AcademicSection> {
    return this.getRepositoryFor(AcademicSection);
  }

  private async validate(schema: ObjectSchema, values: AcademicSectionData): Promise<AcademicSectionData> {
    // perform schema validation
    const data: AcademicSectionData = schema.validateSync(values);

    // more business logic validations
    let whereCondition: string = [
      'academicSection.name = :name',
      'academicSection.code = :code',
      'academicSection.nickname = :nickname'
    ].join(' OR ');

    if (values.id) {
      whereCondition = `(${whereCondition}) AND (academicSection.id != :id)`;
    }

    const repository = this.getRepository();
    const found = await repository
      .createQueryBuilder(AcademicSection.name)
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
        throw new ValidationError(`Parent academic section not found: ${data.parentId}`, data, 'parentId');
      } else if (parent.parent) {
        // only single hierarchy level is allowed; thus parent mustn't have a parent
        throw new ValidationError('Academic section hierarchical relationships cannot exceed 1 level', data, 'parent');
      }

      data.parent = parent;
    }

    return data;
  }
}
