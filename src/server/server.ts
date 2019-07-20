import next from "next";
import express, { Express } from "express";
import { CLIENT_PATH } from "./constants";


class VersityServer {
  public app: Express;
  public clientApp: any;  // TODO: use proper type

  constructor(clientPath: string, debug: boolean=true) {
    this.app = express();
    this.clientApp = next({ dir: clientPath, dev: debug });
    this.configureApp();
  }

  private configureApp(): void {
    this.configureClientServer();
    this.configureApiServer();
  }

  private configureClientServer(): void {
    // handle all non-API related requests
    const handler = this.clientApp.getRequestHandler();
    this.app.get('*', (req, res) => handler(req, res));
  }

  private configureApiServer() {
    // TODO: pending...
  }

  public ready(callback: (app: Express) => void): void {
    this.clientApp.prepare().then(() => {
      callback(this.app);
    });
  }
}

const port: number = Number(process.env.PORT) || 3000;
const debug: boolean = process.env.NODE_ENV !== 'production';

const server = new VersityServer(CLIENT_PATH, debug);
server.ready((app: Express) => {
  app.listen(port, () => console.log(`\n>> Versity running at "http://localhost:${port}/"`));
});
