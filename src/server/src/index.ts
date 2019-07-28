import { Application } from 'express';
import VersityServer from './app';
import * as conf from './constants';
import { logger } from './utils';


const appUrl = conf.VERSITY_URL;

new VersityServer().ready((app: Application) => {
  app.listen(
    Number(appUrl.port), appUrl.hostname,
    () => logger.info(`\n>> Listening at "${appUrl.href}" ...`)
  );
});
