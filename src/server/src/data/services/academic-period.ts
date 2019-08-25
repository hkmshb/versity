import moment from 'moment';
import { EntityRepository, FindOneOptions, Repository } from 'typeorm';
import { ObjectSchema, ValidationError } from 'yup';
import { SchoolService } from '.';
import { AcademicPeriod, School } from '../models';
import { AcademicPeriodData, AcademicPeriodSchema, RequiredIdSchema } from '../schemas';
import { EntityService } from '../types';


@EntityRepository(AcademicPeriod)
export default class AcademicPeriodService extends EntityService<AcademicPeriod, AcademicPeriodData> {
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
      throw new ValidationError(
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
    let school: School = null;
    let parent: AcademicPeriod = null;

    const repository = this.getRepository();

    // check for AcademicPeriod object if parentId is given
    if (values.parentId) {
      parent = await repository.findOne(values.parentId, {relations: ['parent', 'school']});
      if (!parent) {
        throw new ValidationError(`Parent academic period not found: ${values.parentId}`, values, 'parentId');
      }

      if (!values.schoolId && !parent.school) {
        throw new ValidationError(
          `School not found for parent with id '${values.parentId}'`,
          values, 'parentId'
        );
      }

      school = parent.school;
      values.schoolId = parent.school.id;
    }

    // perform schema validation
    const data: AcademicPeriodData = schema.validateSync(values);

    // check for School object if schoolId is given
    if (data.schoolId && !school) {
      const schoolService = this.manager.connection.findEntityServiceFor(School);
      school = await schoolService.findByIdent(data.schoolId);
      if (!school) {
        throw new ValidationError(`School not found: ${data.schoolId}`, data, 'schoolId');
      }
    }

    // ensure associated school is an institution i.e. has not parent school
    if (school.parent) {
      throw new ValidationError(
        'Academic periods can only be created for top level schools', data, 'schoolId'
      );
    }

    // validate date range
    if (data.dateBegin && !data.dateEnd) {
      throw new ValidationError('dateEnd expected if dateBegin provided', data, 'dateEnd');
    } else if (!data.dateBegin && data.dateEnd) {
      throw new ValidationError('dateBegin expected if dateEnd provided', data, 'dateBegin');
    } else if (data.dateBegin && data.dateEnd) {
      if (moment(data.dateBegin).isAfter(data.dateEnd)) {
        throw new ValidationError('dateBegin cannot be later than dateEnd', data, 'dateBegin');
      }

      if (parent) {
        if (parent.dateBegin && parent.dateEnd) {
          if (moment(data.dateBegin).isBefore(parent.dateBegin)) {
            throw new ValidationError('dateBegin cannot come before parent dateBegin', data, 'dateBegin');
          } else if (moment(data.dateEnd).isAfter(parent.dateEnd)) {
            throw new ValidationError('dateEnd cannot come after parent dateEnd', data, 'dateEnd');
          }
        }

        // ensure date range doesn't overlap date range for periods of same level
        const findOption = {where: {parent: {id: parent.id}}};
        const periods = await repository.find(findOption);
        periods.forEach(p => this.validateNoDateOverlap(data, p));
      }
    }

    data.parent = parent;
    data.school = school;
    return data;
  }

  private validateNoDateOverlap(data: AcademicPeriodData, other: AcademicPeriod) {
    if (data.dateBegin && data.dateEnd && other && other.dateBegin && other.dateEnd) {
      if (moment(data.dateBegin).isBetween(other.dateBegin, other.dateEnd)) {
        throw new ValidationError(
          'dateBegin overlaps date range of another academic period', data, 'dateBegin'
        );
      } else if (moment(data.dateEnd).isBetween(other.dateBegin, other.dateEnd)) {
        throw new ValidationError(
          'dateEnd overlaps date range of another academic period', data, 'dateEnd'
        );
      }
    }
  }

}
