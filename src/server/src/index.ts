import { Application } from 'express';
import 'reflect-metadata';
import VersityServer from './app';
import * as conf from './config';
import { logger } from './utils';


const appUrl = conf.API_BASEURL;

new VersityServer().ready((app: Application) => {
  app.listen(
    Number(appUrl.port), appUrl.hostname,
    () => logger.info(`\n>> Listening at "${appUrl.href}" ...`)
  );
});
