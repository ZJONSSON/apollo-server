import { HttpContext, FunctionRequest } from './azureFunctions';
import { ApolloServerBase } from 'apollo-server-core';
import { GraphQLOptions, Config } from 'apollo-server-core';
export interface CreateHandlerOptions {
    cors?: {
        origin?: boolean | string | string[];
        methods?: string | string[];
        allowedHeaders?: string | string[];
        exposedHeaders?: string | string[];
        credentials?: boolean;
        maxAge?: number;
    };
}
export declare class ApolloServer extends ApolloServerBase {
    constructor(options: Config);
    createGraphQLServerOptions(request: FunctionRequest, context: HttpContext): Promise<GraphQLOptions>;
    createHandler({ cors }?: CreateHandlerOptions): (context: HttpContext, req: FunctionRequest) => void;
}
//# sourceMappingURL=ApolloServer.d.ts.map