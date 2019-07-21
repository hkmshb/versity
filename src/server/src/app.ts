import express, { Application } from "express";
import { API_RELPATH } from "./constants";
import ApiRoutes from "./routes";


class VersityServer {
  public app: Application;

  constructor() {
    this.app = express();
    this.configureApp();
  }

  private configureApp(): void {
    const apiRoutes = new ApiRoutes(this.app);
    this.app.use(`/${API_RELPATH}`, apiRoutes.router);
  }

  public ready(callback: (app: Application) => void): void {
    callback(this.app);
  }
}

export default VersityServer;
