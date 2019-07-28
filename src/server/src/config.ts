/**
 * @file Defines types and constants.
 */
import { URL } from 'url';


/**
 * Returns environment variable value for provided name if set otherwise throws error.
 * @param name Name of the environment variable value to retrieve.
 */
const getEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required env var missing: '${name}'`);
  }
  return value;
};


/**
 * CONSTANTS
 */
export const API_RELPATH = 'api/v1';
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const VERSITY_URL: URL = new URL(getEnv('VERSITY_API_URL'));

export const LOG_LEVEL = process.env.LOG_LEVEL || (
  IS_PRODUCTION ? 'info' : 'debug'
);
