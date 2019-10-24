import { Router } from 'express';
import { AcademicSectionController } from '../controllers';


const controller = new AcademicSectionController();
const router: Router = Router();
router
  .get('/', controller.listSchools)
  .get('/:ident', controller.getSchool)
  .post('/', controller.createSchool)
  .put('/:ident', controller.updateSchool)
  .patch('/:ident', controller.updateSchool);

export default router;
