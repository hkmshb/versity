import * as yup from 'yup';
import { School } from './models';


// tslint:disable:interface-name
export interface SchoolData extends Partial<School> {
  parentId?: number;
}


export const RequiredIdSchema = yup.object().shape({
  id: yup.number().required()
});


export const SchoolSchema = yup.object().shape({
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
