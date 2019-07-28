import * as log from 'loglevel';


/**
 * writes out logged values that are gte INFO
 * TRACE=0; DEBUG=1; INFO=2; WARN=3; ERROR=4; SILENT=5;
 */
log.setDefaultLevel(log.levels.INFO);


export {
  log
};
