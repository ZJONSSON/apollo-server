import { HttpContext, FunctionRequest, FunctionResponse } from './azureFunctions';
import { GraphQLOptions } from 'apollo-server-core';
export interface AzureFunctionGraphQLOptionsFunction {
    (request: FunctionRequest, context: HttpContext): GraphQLOptions | Promise<GraphQLOptions>;
}
export interface AzureFunctionHandler {
    (context: HttpContext, request: FunctionRequest, callback: (err?: any, output?: FunctionResponse) => void): void;
}
export declare function graphqlAzureFunction(options: GraphQLOptions | AzureFunctionGraphQLOptionsFunction): AzureFunctionHandler;
//# sourceMappingURL=azureFunctionApollo.d.ts.map