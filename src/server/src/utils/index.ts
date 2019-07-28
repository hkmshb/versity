import pino from 'pino';


let logLevel = process.env.LOG_LEVEL;
if (!logLevel) {
  logLevel = (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
}

export const logger = pino({
  name: 'versity',
  level: logLevel
});
