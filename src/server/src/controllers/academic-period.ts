import { Request, Response } from 'express';
import { ObjectType } from 'typeorm';
import { getDbConnection, models } from '../data';
import { EntityService } from '../data/types';


export default class AcademicPeriodController {
  listAcademicPeriods = async (req: Request, res: Response): Promise<Response> => {
    throw new Error('yet to be implemented');
  }

  getAcademicPeriod = async (req: Request, res: Response): Promise<Response> => {
    throw new Error('yet to be implemented');
  }

  createAcademicPeriod = async (req: Request, res: Response): Promise<Response> => {
    throw new Error('yet to be implemented');
  }

  updateAcademicPeriod = async (req: Request, res: Response): Promise<Response> => {
    throw new Error('yet to be implemented');
  }
}
