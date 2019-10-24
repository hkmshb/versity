import { Request, Response } from 'express';
import { models } from '../data';
import { BaseController } from './types';


export default class AcademicSectionController extends BaseController {

  /**
   * Returns a paginated list of sections.
   */
  listSchools = async (req: Request, res: Response): Promise<Response> => {
    return this.findService(models.AcademicSection)
      .then(service => service.getRepository().find())
      .then(sections => res.status(200).json(sections));
  }

  getSchool = async (req: Request, res: Response): Promise<Response> => {
    return this.findService(models.AcademicSection)
      .then(service => service.findByIdent(req.params.ident))
      .then(section => res.status(200).json(section))
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
    return this.findService(models.AcademicSection)
      .then(service => service.createAndSave({...req.body}))
      .then(section => {
        return res.status(201).json(section);
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
    const service = await this.findService(models.AcademicSection);
    return service.findByIdent(req.params.ident)
      .then(section => {
        const updateData = {...section, ...req.body};
        return service.updateAndSave(updateData);
      })
      .then(section => res.status(200).json(section))
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
