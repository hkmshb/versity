import { Router, Request, Response } from "express";
import schoolRoutes from "./school";


/**
 * Aggregates all the API endpoints behind a common sub path.
 */
export default class ApiRoutes {
  public router: Router = Router();

  constructor(app) {
    this.router.get('/', this.listEndpoints);
    this.router.use('/schools', schoolRoutes);
  }

  private listEndpoints(req: Request, res: Response): void {
    res.status(200)
      .send({
        "message": "Implementation is pending..."
      })
  }
}