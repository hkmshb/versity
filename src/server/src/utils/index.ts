import pino from 'pino';
import * as conf from '../config';


/**
 * LOGGER
 */
export const logger = pino({
  name: 'versity',
  level: conf.LOG_LEVEL
});
