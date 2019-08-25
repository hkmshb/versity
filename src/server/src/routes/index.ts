import { Request, Response, Router } from 'express';
import * as conf from '../config';
import academicPeriodRoutes from './academic-period';
import schoolRoutes from './school';


/**
 * Aggregates all the API endpoints behind a common sub path.
 */
export default class ApiRoutes {
  router: Router = Router();
  private routes: Array<{name: string, path: string, router: Router}> = [
    {name: 'academic-periods', path: '/academic-periods', router: academicPeriodRoutes},
    {name: 'schools', path: '/schools', router: schoolRoutes},
  ];

  constructor(app) {
    this.router.get('/', this.listEndpoints.bind(this));
    this.routes.forEach(entry => this.router.use(entry.path, entry.router));
  }

  // TODO: drop manual listing
  private listEndpoints(req: Request, res: Response): void {
    const baseUrl = conf.API_BASEURL.href.slice(0, -1);
    const endPoints = this.routes.map(entry => (
      {[entry.name]: `${baseUrl}${entry.path}`}
    ));

    res.status(200).json(Object.assign({}, ...endPoints));
  }
}
