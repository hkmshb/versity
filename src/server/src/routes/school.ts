import { Router } from 'express';
import { SchoolController } from '../controllers';


class SchoolRoutes {
  private controller = new SchoolController();
  public router: Router = Router();

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
