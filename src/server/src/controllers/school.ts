import { Request, Response } from 'express';
import { ObjectType } from 'typeorm';
import { getDbConnection, models } from '../data';
import { EntityService } from '../data/types';
import { BaseController } from './types';


export default class SchoolController extends BaseController {

  /**
   * Returns a paginated list of schools.
   */
  listSchools = async (req: Request, res: Response): Promise<Response> => {
    return this.findService(models.School)
      .then(service => service.getRepository().find())
      .then(schools => res.status(200).json(schools));
  }

  getSchool = async (req: Request, res: Response): Promise<Response> => {
    return this.findService(models.School)
      .then(service => service.findByIdent(req.params.ident))
      .then(school => res.status(200).json(school))
      .catch(err => {
        const errmsg = {errors: {ident: err.message}};
        if (err.message.includes('not found')) {
          return res.status(404).json(errmsg);
        }
        return res.status(400).json(errmsg);
      });
  }

  /**
   * Creates a School from provided arguments which is then returned as part of a response.
   */
  createSchool = async (req: Request, res: Response): Promise<Response> => {
    return this.findService(models.School)
      .then(service => service.createAndSave({...req.body}))
      .then(school => {
        return res.status(201).json(school);
      })
      .catch(err => {
        const errmsg = {errors: err.message};
        if (err.name && err.name === 'ValidationError') {
          const errdata = {[err.path]: err.message};
          errmsg.errors = errdata;
        }
        return res.status(400).json(errmsg);
      });
  }

  updateSchool = async (req: Request, res: Response): Promise<Response> => {
    const service = await this.findService(models.School);
    return service.findByIdent(req.params.ident)
      .then(school => {
        const schoolUpdate = {...school, ...req.body};
        return service.updateAndSave(schoolUpdate);
      })
      .then(school => res.status(200).json(school))
      .catch(err => {
        if (err.message.includes('not found')) {
          const errnotfound = {errors: {ident: err.message}};
          return res.status(404).json(errnotfound);
        }

        const errmsg = {errors: {msg: err.message}};
        return res.status(400).json(errmsg);
      });
  }
}
