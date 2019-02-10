import { GraphQLSchema, GraphQLFieldResolver, DocumentNode } from 'graphql';
import { GraphQLExtension } from 'graphql-extensions';
import { DataSource } from 'apollo-datasource';
import { PersistedQueryOptions } from '.';
import { CacheControlExtensionOptions } from 'apollo-cache-control';
import { GraphQLRequest, GraphQLResponse, GraphQLRequestContext, InvalidGraphQLRequestError, ValidationRule } from '../dist/requestPipelineAPI';
import { ApolloServerPlugin } from 'apollo-server-plugin-base';
import { InMemoryLRUCache } from 'apollo-server-caching';
export { GraphQLRequest, GraphQLResponse, GraphQLRequestContext, InvalidGraphQLRequestError, };
export interface GraphQLRequestPipelineConfig<TContext> {
    schema: GraphQLSchema;
    rootValue?: ((document: DocumentNode) => any) | any;
    validationRules?: ValidationRule[];
    fieldResolver?: GraphQLFieldResolver<any, TContext>;
    dataSources?: () => DataSources<TContext>;
    extensions?: Array<() => GraphQLExtension>;
    tracing?: boolean;
    persistedQueries?: PersistedQueryOptions;
    cacheControl?: CacheControlExtensionOptions;
    formatError?: Function;
    formatResponse?: Function;
    plugins?: ApolloServerPlugin[];
    documentStore?: InMemoryLRUCache<DocumentNode>;
}
export declare type DataSources<TContext> = {
    [name: string]: DataSource<TContext>;
};
declare type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};
export declare function processGraphQLRequest<TContext>(config: GraphQLRequestPipelineConfig<TContext>, requestContext: Mutable<GraphQLRequestContext<TContext>>): Promise<GraphQLResponse>;
//# sourceMappingURL=requestPipeline.d.ts.map