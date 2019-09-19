import * as H from 'history';
import React from 'react';
import { RouteComponentProps, StaticContext } from 'react-router';

export * from 'type-fest';

export const tuple = <T extends string[]>(...args: T) => args;

export interface IRoute {
  path?: string;
  component?: string;
  routes?: IRoute[];
  Routes?: string[];
  redirect?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface IRouteComponentProps<
  Params extends { [K in keyof Params]?: string } = {},
  C extends StaticContext = StaticContext,
  S = H.LocationState
> extends RouteComponentProps<Params, C, S> {
  route?: IRoute;
}

export interface IRCP<
  Params extends { [K in keyof Params]?: string } = {},
  C extends StaticContext = StaticContext,
  S = H.LocationState
> extends RouteComponentProps<Params, C, S> {
  route?: IRoute;
}

export type IReactComponent<P> =
  | React.StatelessComponent<P>
  | React.ComponentClass<P>
  | React.ClassicComponentClass<P>
  | React.SFC<P>;
