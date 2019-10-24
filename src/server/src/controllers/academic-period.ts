import { Request, Response } from 'express';
import { ObjectType } from 'typeorm';
import { getDbConnection, models } from '../data';
import { EntityService } from '../data/types';
import { BaseController } from './types';


export default class AcademicPeriodController extends BaseController {
  listAcademicPeriods = async (req: Request, res: Response): Promise<Response> => {
    return this.findService(models.AcademicPeriod)
      .then(service => service.getRepository().find())
      .then(periods => res.status(200).json(periods));
  }

  getAcademicPeriod = async (req: Request, res: Response): Promise<Response> => {
    return this.findService(models.AcademicPeriod)
      .then(service => service.findByIdent(req.params.ident))
      .then(period => res.status(200).json(period))
      .catch(err => {
        const errmsg = {errors: {ident: err.message}};
        if (err.message.includes('not found')) {
          return res.status(404).json(errmsg);
        }
        return res.status(400).json(errmsg);
      });
  }

  createAcademicPeriod = async (req: Request, res: Response): Promise<Response> => {
    return this.findService(models.AcademicPeriod)
      .then(service => service.createAndSave({...req.body}))
      .then(period => res.status(201).json(period))
      .catch(err => {
        const errmsg = {errors: err.message};
        if (err.name && err.name === 'ValidationError') {
          const errdata = {[err.path]: err.message};
          errmsg.errors = errdata;
        }
        return res.status(400).json(errmsg);
      });
  }

  updateAcademicPeriod = async (req: Request, res: Response): Promise<Response> => {
    const service = await this.findService(models.AcademicPeriod);
    return service.findByIdent(req.params.ident)
      .then(period => {
        const updateData = {...period, ...req.body};
        return service.updateAndSave(updateData);
      })
      .then(period => res.status(200).json(period))
      .catch(err => {
        if (err.message.includes('not found')) {
          const errdata = {errors: {ident: err.message}};
          return res.status(404).json(errdata);
        }

        const errmsg = {errors: {msg: err.message}};
        return res.status(400).json(errmsg);
      });
  }

}
