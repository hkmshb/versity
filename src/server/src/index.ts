import { Application } from 'express';
import VersityServer from './app';
import * as conf from './config';
import { initDbConnection } from './data';
import { logger } from './utils';


const appUrl = conf.API_BASEURL;

new VersityServer().ready((app: Application) => {
  // TODO: drop latter
  initDbConnection({ synchronize: true });

  // start app
  app.listen(
    Number(appUrl.port), appUrl.hostname,
    () => logger.info(`\n>> Listening at "${appUrl.href}" ...`)
  );
});
