import { Router } from 'express';
import { AcademicSectionController } from '../controllers';


const controller = new AcademicSectionController();
const router: Router = Router();
router
  .get('/', this.controller.listSchools)
  .get('/:ident', this.controller.getSchool)
  .post('/', this.controller.createSchool)
  .put('/:ident', this.controller.updateSchool)
  .patch('/:ident', this.controller.updateSchool);

export default router;
