import { Application } from "express";
import VersityServer from "./app";
import * as conf from './constants';


const appUrl = conf.VERSITY_URL;

new VersityServer().ready((app: Application) => {
  app.listen(
    Number(appUrl.port), appUrl.hostname,
    () => console.log(`\n>> Listening at "${appUrl.href}" ...`)
  );
})
