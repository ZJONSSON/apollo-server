import lambda from 'aws-lambda';
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
    createGraphQLServerOptions(event: lambda.APIGatewayProxyEvent, context: lambda.Context): Promise<GraphQLOptions>;
    createHandler({ cors }?: CreateHandlerOptions): (event: lambda.APIGatewayProxyEvent, context: lambda.Context, callback: lambda.Callback<lambda.APIGatewayProxyResult>) => void;
}
//# sourceMappingURL=ApolloServer.d.ts.map