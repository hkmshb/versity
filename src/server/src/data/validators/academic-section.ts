import { EntityManager } from 'typeorm';
import { AcademicPeriod, AcademicSection } from '../models';
import { AcademicSectionData } from '../schemas';
import { EntityError, IValidator } from '../types';


export class ParentAcademicSectionValidator implements IValidator<AcademicSection, AcademicSectionData> {
  constructor(public manager: EntityManager) {
  }

  async check(
    values: AcademicSectionData,
    errors: EntityError<AcademicSectionData>
  ): Promise<AcademicSectionData> {
    if (values.parentId) {
      const options = { relations: ['children'] };
      try {
        values.parent = await this.manager
          .connection
          .findEntityServiceFor(AcademicSection)
          .findByIdent(values.parentId, options);

        values.parentId = values.parent.id;
      } catch (err) {
        errors.parentId = err.message;
        return values;
      }

      if (!values.parent) {
        errors.parentId = `Parent academic section not found: ${values.parentId}`;
        return values;
      } else if (values.parent.parent) {
        // only single hierarchy level is allowed; thus parent mustn't have a parent
        errors.parent = 'Academic section hierarchical relationships cannot exceed 1 level';
      }
    }
    return values;
  }
}


export class AcademicSectionUniquenessValidator implements IValidator<AcademicSection, AcademicSectionData> {
  constructor(public manager: EntityManager) {
  }

  async check(
    values: AcademicSectionData,
    errors: EntityError<AcademicSectionData>
  ): Promise<AcademicSectionData> {
    let whereConditions: string  = [
      'academicSection.name = :name',
      'academicSection.code = :code',
      'academicSection.nickname = :nickname'
    ].join(' OR ');

    if (values.id) {
      whereConditions = `(${whereConditions}) AND (academicSection.id != :id)`;
    }

    const found = await this.manager
      .getRepository(AcademicSection)
      .createQueryBuilder(AcademicSection.name)
      .where(whereConditions, values)
      .getMany()
      .then(sections => {
        if (!values.parentId) {
          return sections[0];
        }
        return sections.filter(
          s => s.parent && s.parent.id === values.parentId
        )[0];
      });

    if (found) {
      const fieldName = (found.name === values.name
        ? 'name' : (found.code === values.code
          ? 'code' : 'nickname'));

      errors[fieldName] = `${fieldName} already in use: ${values.name}`;
    }
    return values;
  }
}
