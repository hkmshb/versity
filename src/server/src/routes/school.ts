import { Router } from 'express';
import { SchoolController } from '../controllers';


class SchoolRoutes {
  router: Router = Router();
  private controller = new SchoolController();

  constructor() {
    this.config();
  }

  private config() {
    this.router.get('/', this.controller.listSchools);
    this.router.get('/:ident', this.controller.getSchool);

    this.router.post('/', this.controller.createSchool);
    this.router.put('/:ident', this.controller.updateSchool);
    this.router.patch('/:ident', this.controller.updateSchool);
    return this.router;
  }
}

const routes = new SchoolRoutes().router;
export default routes;
