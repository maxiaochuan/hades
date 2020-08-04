import { camelCase, isObject } from 'lodash';
import mapObject from './mapObject';

const cache = new Map();

export interface ICamelcaseKeysOpts {
  /**
   * @default false
   *
   */
  readonly deep?: boolean;

  /**
   * @default []
   */
  readonly exclude?: Array<string | RegExp>;
}

const isObjectOrArray = (input: unknown): input is Record<string, unknown> =>
  Array.isArray(input) || isObject(input);
const has = (array: Array<string | RegExp>, key: string) =>
  array.some(x => (typeof x === 'string' ? x === key : x.test(key)));

const camelcaseKeys = <T = unknown>(input: unknown, opts: ICamelcaseKeysOpts = {}): T => {
  const options = { deep: false, ...opts };
  const { exclude } = options;

  const fn = (k: string, v: unknown): [string, unknown] =>
    exclude && has(exclude, k) ? [k, v] : [cache.get(k) || cache.set(k, camelCase(k)).get(k), v];

  if (Array.isArray(input)) {
    return (input.map(v => (isObjectOrArray(v) ? mapObject(v, fn, options) : v)) as unknown) as T;
  }

  return (isObjectOrArray(input) ? mapObject(input, fn, options) : input) as T;
};

export default camelcaseKeys;
