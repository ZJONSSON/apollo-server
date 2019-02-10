/// <reference types="node" />
import { GraphQLOptions } from 'apollo-server-core';
import { RequestHandler } from 'micro';
import { IncomingMessage } from 'http';
export interface MicroGraphQLOptionsFunction {
    (req?: IncomingMessage): GraphQLOptions | Promise<GraphQLOptions>;
}
export declare function graphqlMicro(options: GraphQLOptions | MicroGraphQLOptionsFunction): RequestHandler;
//# sourceMappingURL=microApollo.d.ts.map