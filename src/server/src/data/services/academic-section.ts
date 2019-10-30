import fs from 'fs';
import _ from 'lodash';
import { EntityManager, EntityRepository, FindOneOptions, Repository } from 'typeorm';
import xlsx from 'xlsx';
import { ObjectSchema, ValidationError as YupError } from 'yup';
import { Dictionary } from '../../types';
import { logger } from '../../utils';
import { AcademicSection } from '../models';
import { AcademicSectionData, AcademicSectionSchema, RequiredIdSchema } from '../schemas';
import { DataImportError, EntityError, EntityService, ValidationError } from '../types';
import {
  AcademicSectionUniquenessValidator,
  ParentAcademicSectionValidator
} from '../validators/academic-section';


@EntityRepository(AcademicSection)
export default class AcademicSectionService extends EntityService<AcademicSection, AcademicSectionData> {

  constructor(manager: EntityManager) {
    super(manager);
    this.prevalidators.push(new ParentAcademicSectionValidator(this.manager));
    this.validators.push(new AcademicSectionUniquenessValidator(this.manager));
  }

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
      throw new YupError(`Academic section not found for ${sectionId}`, values, 'id');
    }

    const data = await this.validate(AcademicSectionSchema, values);
    const instance = this.manager.create(AcademicSection, {...section, ...data});
    return this.manager.save(instance);
  }

  /**
   * Finds and returns a persisted Academic section object from storage.
   */
  findByIdent(ident?: number | string, options?: FindOneOptions<AcademicSection>): Promise<AcademicSection> {
    let whereClause: Dictionary[] | null = null;
    if (typeof ident === 'string' && ident.startsWith('$ref:')) {
      const [field, value] = ident.substr(5).split('=');
      whereClause = [{[field]: value}];
    }

    return this
      .getRepositoryFor(AcademicSection)
      .findOne({
        ...options,
        where: whereClause || [{id: ident}, {uuid: ident}, {code: ident}],
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
    logger.debug('starting academic section data import...');
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

    logger.debug('starting transaction for saving records ...');
    return this.manager.transaction(async trans => {
      const repository = trans.getRepository(AcademicSection);

      let index = 0;
      for (const row of rows) {
        index += 1;
        try {
          const data = await this.validate(AcademicSectionSchema, row);
          const instance = trans.create(AcademicSection, data);
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

  private async validate(schema: ObjectSchema, values: AcademicSectionData): Promise<AcademicSectionData> {
    const errors: EntityError<AcademicSectionData> = {};

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
