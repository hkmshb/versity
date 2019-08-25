import { Router } from 'express';
import { AcademicPeriodController } from '../controllers';


class AcademicPeriodRoutes {
  router: Router = Router();
  private controller = new AcademicPeriodController();

  constructor() {
    this.config();
  }

  private config() {
    this.router.get('/', this.controller.listAcademicPeriods);
    this.router.get('/:ident', this.controller.getAcademicPeriod);

    this.router.post('/', this.controller.createAcademicPeriod);
    this.router.put('/:ident', this.controller.updateAcademicPeriod);
    this.router.patch('/:ident', this.controller.updateAcademicPeriod);
    return this.router;
  }
}

const routes = new AcademicPeriodRoutes().router;
export default routes;
