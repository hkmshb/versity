// tslint:disable:interface-name
import * as yup from 'yup';
import { AcademicPeriod,  AcademicSection, Department } from './models';


export const buildSchemaForRequiredFields = (names: string[]) => {
  const fields = names.map(name => ({[name]: yup.string().required()}));
  return yup.object().shape(Object.assign({}, ...fields));
};


export interface DepartmentData extends Partial<Department> {
  academicSectionId?: number | string;
}


export const RequiredIdSchema = yup.object().shape({
  id: yup.number().required()
});


export interface AcademicPeriodData extends Partial<AcademicPeriod> {
  parentId?: number | string;
  academicSectionId?: number | string;
}

export const AcademicPeriodSchema = yup.object().shape({
  id: yup.number(),
  uuid: yup.string(),
  parentId: yup.string(),
  academicSectionId: yup.string().required(),
  name: yup.string().required()
    .min(7).max(50),
  dateBegin: yup.date(),
  dateEnd: yup.date(),
});


export interface AcademicSectionData extends Partial<AcademicSection> {
  parentId?: number | string;
}


export const AcademicSectionSchema = yup.object().shape({
  id: yup.number(),
  uuid: yup.string(),
  parentId: yup.number(),
  name: yup.string().required()
    .min(4),
  code: yup.string().required()
    .max(50),
  nickname: yup.string().required()
    .max(15).min(2),
  addrStreet: yup.string().nullable(),
  addrTown: yup.string().nullable(),
  addrState: yup.string().nullable()
});


export const DepartmentSchema = yup.object().shape({
  id: yup.number(),
  uuid: yup.string(),
  academicSectionId: yup.string().required(),
  name: yup.string().required().min(4)
});
