import fs from 'fs';
import _ from 'lodash';
import moment from 'moment';
import { EntityManager, EntityRepository, FindOneOptions, Repository } from 'typeorm';
import xlsx from 'xlsx';
import { ObjectSchema, ValidationError as YupError } from 'yup';
import { Dictionary } from '../../types';
import { logger } from '../../utils';
import { AcademicPeriod } from '../models';
import { AcademicPeriodData, AcademicPeriodSchema, RequiredIdSchema } from '../schemas';
import { DataImportError, EntityError, EntityService, ValidationError } from '../types';
import {
  DateRangeValidator,
  ParentAcademicPeriodValidator,
  ReferencedAcademicSectionValidator,
} from '../validators/academic-period';


@EntityRepository(AcademicPeriod)
export default class AcademicPeriodService extends EntityService<AcademicPeriod, AcademicPeriodData> {
  constructor(manager: EntityManager) {
    super(manager);
    this.prevalidators.push(new ParentAcademicPeriodValidator(this.manager));
    this.validators.push(new ReferencedAcademicSectionValidator(this.manager));
    this.validators.push(new DateRangeValidator(this.manager));
  }

  /**
   * Creates a AcademicPeriod object from provided arguments and persists the object to storage.
   */
  async createAndSave(values: AcademicPeriodData): Promise<AcademicPeriod> {
    // validate against schema
    const data = await this.validate(AcademicPeriodSchema, values);
    const instance = this.manager.create(AcademicPeriod, data);
    return this.manager.save(instance);
  }

  async updateAndSave(values: AcademicPeriodData): Promise<AcademicPeriod> {
    const periodId = RequiredIdSchema.validateSync(values);
    const period = this.getRepositoryFor(AcademicPeriod)
      .findOne(periodId, {relations: ['parent']});

    if (!period) {
      throw new YupError(
        `Academic period not found for ${periodId}`, values, 'periodId'
      );
    }

    const data = await this.validate(AcademicPeriodSchema, values);
    const instance = this.manager.create(AcademicPeriod, {...period, ...data});
    return this.manager.save(instance);
  }

  findByIdent(ident?: number | string, options?: FindOneOptions<AcademicPeriod>): Promise<AcademicPeriod> {
    let whereClause: Dictionary[] | null = null;
    if (typeof ident === 'string' && ident.startsWith('$ref:')) {
      const [field, value] = ident.substr(5).split('=');
      whereClause = [{[field]: value}];
    }

    return this
      .getRepositoryFor(AcademicPeriod)
      .findOne({
        ...options,
        where: whereClause || [{id: ident}, {uuid: ident}, {code: ident}],
        relations: [...((options && options.relations) || []), 'parent']
      })
      .then(period => {
        if (!period) {
          throw new Error(`Academic period not found for '${ident}'`);
        }
        return period;
      });
  }

  /**
   * Returns the ORM repository for an entity.
   */
  getRepository(): Repository<AcademicPeriod> {
    return this.getRepositoryFor(AcademicPeriod);
  }

  async importData(filepath: string): Promise<number> {
    logger.debug('starting academic period data import ...');
    if (!fs.existsSync(filepath)) {
      throw new DataImportError(`File not found: ${filepath}`);
    }

    let rows: AcademicPeriodData[] = [];
    try {
      logger.debug('reading data file ...');
      const workbook = xlsx.readFile(filepath, {cellDates: true});
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
      const repository = trans.getRepository(AcademicPeriod);

      let index = 1;
      for (const row of rows) {
        index += 1;
        try {
          const data = await this.validate(AcademicPeriodSchema, row);
          const instance = trans.create(AcademicPeriod, data);
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

  private async validate(schema: ObjectSchema, values: AcademicPeriodData): Promise<AcademicPeriodData> {
    const errors: EntityError<AcademicPeriodData> = {};

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
