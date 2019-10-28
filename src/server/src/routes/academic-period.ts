import { Router } from 'express';
import { AcademicPeriodController } from '../controllers';


const controller = new AcademicPeriodController();
const router: Router = Router();
router
  .get('/', controller.listAcademicPeriods)
  .get('/:ident', controller.getAcademicPeriod)
  .post('/', controller.createAcademicPeriod)
  .put('/:ident', controller.updateAcademicPeriod)
  .patch('/:ident', controller.updateAcademicPeriod);

export default router;
