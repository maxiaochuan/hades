/* eslint-disable @typescript-eslint/no-explicit-any */
import { print } from 'graphql';
import type { RequestDocument, ParamsType, RequestMiddleware, RequestOptions } from './interface';
import { builtins } from './middlewares';
import Core from './Core';

export function resolveRequestDocument(document: RequestDocument): string {
  if (typeof document === 'string') return document;
  return print(document);
}

export default class GraphQLClient {
  private uri: string;

  private core: Core;

  private options: RequestOptions;

  constructor(uri: string, options: RequestOptions = {}) {
    this.uri = uri;
    this.core = new Core(options, builtins);
    this.options = options;
  }

  public use(m: RequestMiddleware): this {
    this.core.use(m);
    return this;
  }

  /**
   * Send a GraphQL document to the server.
   */
  async request<T = any, V = ParamsType>(document: RequestDocument, variables?: V): Promise<T> {
    const response: any = this.core.request(this.uri, {
      ...this.options,
      method: 'post',
      data: {
        query: resolveRequestDocument(document),
        variables,
      },
    });
    return response.data;
  }
}
