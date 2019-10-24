import fs from 'fs';
import _ from 'lodash';
import { EntityRepository, FindOneOptions, Repository } from 'typeorm';
import xlsx from 'xlsx';
import { ObjectSchema, ValidationError } from 'yup';
import { Dictionary } from '../../types';
import { logger } from '../../utils';
import { AcademicSection } from '../models';
import { AcademicSectionData, AcademicSectionSchema, RequiredIdSchema } from '../schemas';
import { DataImportError, EntityService } from '../types';


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

  async importData(filepath: string): Promise<number> {
    logger.debug('starting academic data import...');
    if (!fs.existsSync(filepath)) {
      throw new DataImportError(`File not found: ${filepath}`);
    }

    let rows: AcademicSectionData[] = [];
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

    logger.debug('starting a transaction for save records ...');
    return this.manager.transaction(async ts => {
      const repository = ts.getRepository(AcademicSection);

      let index = 0;
      for (const row of rows) {
        index += 1;

        if (row.parentId && _.isNaN(_.parseInt(row.parentId))) {
          logger.debug(`resolve non-numberic parentId of ${row.parentId} found at ${index}`);
          const parent = await repository.findOne({
            where: [ {code: row.parentId}, {nickname: row.parentId} ]
          });

          if (!parent) {
            const errorMessage = `Unable to resolve parentId: ${row.parentId}`;
            logger.debug(errorMessage);
            throw new DataImportError({ parentId: errorMessage}, index);
          }
          row.parentId = parent.id;
          row.parent = parent;
        }

        try {
          const data = await this.validate(AcademicSectionSchema, row);
          const instance = ts.create(AcademicSection, data);
          await ts.save(instance);
        } catch (err) {
          logger.error(err.toString());
          if (err.path) {
            throw new DataImportError({[err.path]: err.errors}, index);
          }
          throw new DataImportError(err.errors, index);
        }
      }

      return rows.length;
    });
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
      .getMany()
      .then(sections => {
        if (!data.parentId) {
          return sections[0];
        }

        return sections.filter(
          s => s.parent && s.parent.id === data.parentId
        )[0];
      });

    if (found) {
      const fieldName = (found.name === data.name
          ? 'name' : (found.code === data.code
            ? 'code' : 'nickname'));

      throw new ValidationError(
        `${fieldName} already in use: ${data.name}`, data, `${fieldName}`
      );
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
