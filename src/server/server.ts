import express, { Express } from "express";
import next from "next";


const dev: boolean = process.env.NODE_ENV !== 'production';
const app = next({ dir: './src/client', dev });

const port: number = Number(process.env.PORT) || 3000;
const handler = app.getRequestHandler();


app.prepare().then(() => {
  const server: Express = express();

  server.get('*', (req, res) => handler(req, res));
  server.listen(port, () => console.log(`>> versity up and running @ localhost:${port}`))
});
