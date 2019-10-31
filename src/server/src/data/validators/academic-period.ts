import moment from 'moment';
import { EntityManager, Not } from 'typeorm';
import { AcademicPeriod, AcademicSection } from '../models';
import { AcademicPeriodData } from '../schemas';
import { EntityError, IValidator } from '../types';


export class ParentAcademicPeriodValidator implements IValidator<AcademicPeriod, AcademicPeriodData> {
  constructor(public manager: EntityManager) {
  }

  async check(
    values: AcademicPeriodData,
    errors: EntityError<AcademicPeriodData>
  ): Promise<AcademicPeriodData> {
    if (values.parentId) {
      const options = { relations: ['academicSection'] };
      try {
        values.parent = await this.manager
          .connection
          .findEntityServiceFor(AcademicPeriod)
          .findByIdent(values.parentId, options);

        values.parentId = values.parent.id;
      } catch (err) {
        errors.parentId = err.message;
        return values;
      }

      if (!values.parent) {
        errors.parentId = `Parent academic period not found: ${values.parentId}`;
        return values;
      }

      if (!values.academicSectionId) {
        if (!values.parent.academicSection) {
          errors.parentId = `Academic Section not found for parent with id '${values.parentId}'`;
          return values;
        }
        values.academicSectionId = values.parent.academicSection.id;
      }
    }
    return values;
  }
}


export class ReferencedAcademicSectionValidator implements IValidator<AcademicPeriod, AcademicPeriodData> {
  constructor(public manager: EntityManager) {
  }

  async check(
    values: AcademicPeriodData,
    errors: EntityError<AcademicPeriodData>
  ): Promise<AcademicPeriodData> {
    if (!values.academicSectionId) {
      errors.academicSectionId = 'academicSectionId is a required field';
      return;
    }

    if (!values.academicSection) {
      const schoolService = this.manager.connection.findEntityServiceFor(AcademicSection);
      values.academicSection = await schoolService.findByIdent(values.academicSectionId);
      if (!values.academicSection) {
        errors.academicSectionId = `AcademicSection not found: ${values.academicSectionId}`;
        return;
      }

      values.academicSectionId = values.academicSection.id;
    }

    // ensure associated school is an institution thus it mustn't have a parent
    if (values.academicSection.parent) {
      errors.academicSectionId = 'Academic periods can only be created for top level schools';
      return;
    }

    return values;
  }
}


export class DateRangeValidator implements IValidator<AcademicPeriod, AcademicPeriodData> {
  constructor(public manager: EntityManager) {
  }

  async check(
    values: AcademicPeriodData,
    errors: EntityError<AcademicPeriodData>
  ): Promise<AcademicPeriodData> {
    if (values.dateBegin && !values.dateEnd) {
      errors.dateEnd = 'dataEnd expected if dateBegin provided';
      return values;
    }

    if (!values.dateBegin && values.dateEnd) {
      errors.dateBegin = 'dateBegin expected if dateEnd provided';
      return values;
    }

    if (values.dateBegin && values.dateEnd) {
      if (moment(values.dateBegin).isAfter(values.dateEnd)) {
        errors.dateBegin = 'dateBegin cannot be later than dateEnd';
        return;
      }

      // validate against parent period that has dates
      const parent = values.parentId && values.parent;
      if (parent && parent.dateBegin && parent.dateEnd) {
        // ensure provided date range within parent date range
        if (moment(values.dateBegin).isBefore(parent.dateBegin)) {
          errors.dateBegin = 'dateBegin cannot come before parent dateBegin';
          return values;
        } else if (moment(values.dateEnd).isAfter(parent.dateEnd)) {
          errors.dateEnd = 'dateEnd cannot come after parent dateEnd';
          return values;
        }
      }

      if (parent) {
        // ensure date range doesn't overlap date range for periods of same level
        const repository = this.manager.getRepository(AcademicPeriod);
        const findOption: any = { where: { parent: { id: parent.id  } } };
        if (values.id) {
          findOption.where.id = Not(values.id);
        }

        const siblings = await repository.find(findOption);
        for (const sibling of siblings) {
          if (this.hasDateOverlap(values, sibling, errors)) {
            break;
          }
        }
      }
    }

    return values;
  }

  hasDateOverlap(
    values: AcademicPeriodData,
    sibling: AcademicPeriod,
    errors: EntityError<AcademicPeriodData>
  ): boolean {
    if (sibling && sibling.dateBegin && sibling.dateEnd) {
      if (moment(values.dateBegin).isBetween(sibling.dateBegin, sibling.dateEnd)) {
        errors.dateBegin = 'dateBegin overlaps date range of sibling academic period';
        return true;
      } else if (moment(values.dateEnd).isBetween(sibling.dateBegin, sibling.dateEnd)) {
        errors.dateEnd = 'dateEnd overlaps date range of sibling academic period';
        return true;
      }
    }
    return false;
  }
}
