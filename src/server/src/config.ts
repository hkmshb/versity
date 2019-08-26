/**
 * @file Defines types and constants.
 */
import { URL } from 'url';


/**
 *
 */
export const IS_TEST_ENV = ['test', 'debug'].includes(process.env.NODE_ENV);
export const IS_PROD_ENV = ['live', 'prod', 'production'].includes(process.env.NODE_ENV);


/**
 * Returns environment variable value for provided name if set otherwise throws error.
 * @param name Name of the environment variable value to retrieve.
 */
const getEnv = (name: string, defaultValue: string = null): string => {
  const value = process.env[name];
  if (!value && !defaultValue && !IS_TEST_ENV) {
    throw new Error(`Required env var missing: '${name}'`);
  }
  return value || defaultValue;
};


export const LOG_LEVEL = getEnv('LOG_LEVEL', (IS_PROD_ENV ? 'info' : 'debug'));

export const API_BASEURL: URL = new URL(getEnv('VERSITY_API_BASEURL'));
export const DATABASE_URL: URL = new URL(getEnv('VERSITY_DATABASE_URL'));
