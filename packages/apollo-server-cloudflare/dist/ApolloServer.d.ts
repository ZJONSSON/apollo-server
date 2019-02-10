import { ApolloServerBase } from 'apollo-server-core';
export { GraphQLOptions, GraphQLExtension } from 'apollo-server-core';
import { GraphQLOptions } from 'apollo-server-core';
import { Request } from 'apollo-server-env';
export declare class ApolloServer extends ApolloServerBase {
    createGraphQLServerOptions(request: Request): Promise<GraphQLOptions>;
    listen(): Promise<{
        url: string;
        port: null;
    }>;
}
//# sourceMappingURL=ApolloServer.d.ts.map