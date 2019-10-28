import moment from 'moment';
import { EntityManager, EntityRepository, FindOneOptions, Repository } from 'typeorm';
import { ObjectSchema, ValidationError as YupError } from 'yup';
import { AcademicPeriod, AcademicSection } from '../models';
import { AcademicPeriodData, AcademicPeriodSchema, RequiredIdSchema } from '../schemas';
import { EntityError, EntityService, ValidationError } from '../types';
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
    return this.getRepositoryFor(AcademicPeriod)
      .findOne({
        ...options,
        where: [{id: ident}, {uuid: ident}, {code: ident}],
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

  private async validate(schema: ObjectSchema, values: AcademicPeriodData): Promise<AcademicPeriodData> {
    const errors: EntityError<AcademicPeriodData> = {};

    // perform pre-validations (needs to be synchronous)
    for (const validator of this.prevalidators) {
      values = await validator.check(values, errors);
      if (!values && errors) {
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

        return Promise.all(promises).then(_ => {
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
