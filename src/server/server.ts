import next from "next";
import express, { Application } from "express";
import { CLIENT_PATH, API_RELPATH } from "./constants";
import ApiRoutes from "./routes";


class VersityServer {
  public app: Application;
  public clientApp: any;  // TODO: use proper type

  constructor(clientPath: string, debug: boolean=true) {
    this.app = express();
    this.clientApp = next({ dir: clientPath, dev: debug });
    this.configureApp();
  }

  private configureApp(): void {
    this.configureApiServer();
    this.configureClientServer();
  }

  private configureClientServer(): void {
    // handle all non-API related requests
    const handler = this.clientApp.getRequestHandler();
    this.app.get('*', (req, res) => handler(req, res));
  }

  private configureApiServer() {
    const apiRoutes = new ApiRoutes(this.app);
    this.app.use(`/${API_RELPATH}`, apiRoutes.router);
  }

  public ready(callback: (app: Application) => void): void {
    this.clientApp.prepare().then(() => {
      callback(this.app);
    });
  }
}

const port: number = Number(process.env.PORT) || 3000;
const debug: boolean = process.env.NODE_ENV !== 'production';

const server = new VersityServer(CLIENT_PATH, debug);
server.ready((app: Application) => {
  app.listen(port, () => console.log(`\n>> Versity running at "http://localhost:${port}/"`));
});
