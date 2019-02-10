import lambda from 'aws-lambda';
import { GraphQLOptions } from 'apollo-server-core';
export interface LambdaGraphQLOptionsFunction {
    (event: lambda.APIGatewayProxyEvent, context: lambda.Context): GraphQLOptions | Promise<GraphQLOptions>;
}
export declare function graphqlLambda(options: GraphQLOptions | LambdaGraphQLOptionsFunction): lambda.APIGatewayProxyHandler;
//# sourceMappingURL=lambdaApollo.d.ts.map