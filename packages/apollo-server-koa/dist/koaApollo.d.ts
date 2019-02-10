import Koa from 'koa';
import { GraphQLOptions } from 'apollo-server-core';
export interface KoaGraphQLOptionsFunction {
    (ctx: Koa.Context): GraphQLOptions | Promise<GraphQLOptions>;
}
export interface KoaHandler {
    (ctx: Koa.Context, next: any): void;
}
export declare function graphqlKoa(options: GraphQLOptions | KoaGraphQLOptionsFunction): KoaHandler;
//# sourceMappingURL=koaApollo.d.ts.map