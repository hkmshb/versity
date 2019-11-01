import { EntityManager } from 'typeorm';
import { AcademicSection, Department } from '../models';
import { DepartmentData } from '../schemas';
import { EntityError, IValidator } from '../types';


export class OperationTypeValidator implements IValidator<Department, DepartmentData> {
  constructor(public manager: EntityManager) {}

  async check(values: DepartmentData, errors: EntityError<DepartmentData>): Promise<DepartmentData> {
    if (!values.id && !values.academicSectionId) { // neither a create nor update command
      errors.academicSectionId = `Parent academics section id missing`;
    }
    return values;
  }
}


export class ReferenceAcademicSectionValidator implements IValidator<Department, DepartmentData> {
  constructor(public manager: EntityManager) {}

  async check(values: DepartmentData, errors: EntityError<DepartmentData>): Promise<DepartmentData> {
    if (values.academicSectionId) {
      const sectionService = this.manager.connection.findEntityServiceFor(AcademicSection);
      let academicSection = null;
      try {
        academicSection = await sectionService.findByIdent(values.academicSectionId);
      } catch (err) {
        errors.academicSectionId = `Reference academic section not found: ${values.academicSectionId}`;
        return values;
      }
      // check if the academic section is a school
      if (!academicSection.parent) {
        errors.academicSectionId = `Reference academic section is not a faculty: ${values.academicSectionId}`;
        return values;
      }
      values.academicSection = academicSection;
      return values;
    }
  }
}


export class DepartmentUniquenessValidator implements IValidator<Department, DepartmentData> {
  constructor(public manager: EntityManager) {
  }

  async check(values: DepartmentData, errors: EntityError<DepartmentData>): Promise<DepartmentData> {
    let whereCondition: string = 'department.name = :name';

    if (values.id) {
      whereCondition = `(${whereCondition}) AND (department.id != :id)`;
    }
    const found = await this.manager.getRepository(Department)
    .createQueryBuilder(Department.name)
    .leftJoinAndSelect(`${Department.name}.academicSection`, 'academicSection')
    .where(whereCondition, values)
    .getMany()
    .then(departments => {
      if (!values.academicSectionId) {
        return departments[0];
      }
      return departments.filter(
        // tslint:disable:triple-equals
        d =>  d.academicSection && (d.academicSection.id == values.academicSectionId)
      )[0];
    });

    if (found) {
      errors.name = `name already in use: ${values.name} `;
    }

    return values;
  }
}
