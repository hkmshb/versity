import { Application } from "express";
import VersityServer from "./app";


const port: number = Number(process.env.PORT) || 3000;
const server = new VersityServer().ready((app: Application) => {
  app.listen(
    port,
    () => console.log(`\n>> Versity running at "http://localhost:${port}/"`)
  );
})
