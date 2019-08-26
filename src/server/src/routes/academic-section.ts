import { Router } from 'express';
import { AcademicSectionController } from '../controllers';


class AcademicSectionRoutes {
  router: Router = Router();
  private controller = new AcademicSectionController();

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

const routes = new AcademicSectionRoutes().router;
export default routes;
