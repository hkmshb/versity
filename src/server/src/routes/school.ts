import { Router } from 'express';
import { SchoolController } from '../controllers';


class SchoolRoutes {
  router: Router = Router();
  private controller = new SchoolController();

  constructor() {
    this.config();
  }

  private config() {
    this.router.get('/', (req, res) => this.controller.index(req, res));
    return this.router;
  }
}

const routes = new SchoolRoutes().router;
export default routes;
