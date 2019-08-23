import bodyParser from 'body-parser';
import express, { Application } from 'express';
import pinoLogger from 'express-pino-logger';
import ApiRoutes from './routes';
import { logger } from './utils';


class VersityServer {
  app: Application;

  constructor() {
    this.app = express();
    this.configureApp();
  }

  ready(callback: (app: Application) => void): void {
    callback(this.app);
  }

  private configureApp(): void {
    this.configureMiddlewares();

    // configure routes
    const apiRoutes = new ApiRoutes(this.app);
    this.app.use(apiRoutes.router);
  }

  private configureMiddlewares(): void {
    // configure loggers & content parsers
    this.app.use(pinoLogger({ logger }));
    this.app.use(bodyParser.json({limit: '50mb'}));
  }
}

export default VersityServer;
