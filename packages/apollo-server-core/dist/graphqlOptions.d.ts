import { GraphQLSchema, ValidationContext, GraphQLFieldResolver, DocumentNode } from 'graphql';
import { GraphQLExtension } from 'graphql-extensions';
import { CacheControlExtensionOptions } from 'apollo-cache-control';
import { KeyValueCache, InMemoryLRUCache } from 'apollo-server-caching';
import { DataSource } from 'apollo-datasource';
import { ApolloServerPlugin } from 'apollo-server-plugin-base';
export interface GraphQLServerOptions<TContext = Record<string, any>, TRootValue = any> {
    schema: GraphQLSchema;
    formatError?: Function;
    rootValue?: ((parsedQuery: DocumentNode) => TRootValue) | TRootValue;
    context?: TContext | (() => never);
    validationRules?: Array<(context: ValidationContext) => any>;
    formatResponse?: Function;
    fieldResolver?: GraphQLFieldResolver<any, TContext>;
    debug?: boolean;
    tracing?: boolean;
    cacheControl?: CacheControlExtensionOptions;
    extensions?: Array<() => GraphQLExtension>;
    dataSources?: () => DataSources<TContext>;
    cache?: KeyValueCache;
    persistedQueries?: PersistedQueryOptions;
    plugins?: ApolloServerPlugin[];
    documentStore?: InMemoryLRUCache<DocumentNode>;
}
export declare type DataSources<TContext> = {
    [name: string]: DataSource<TContext>;
};
export interface PersistedQueryOptions {
    cache: KeyValueCache;
}
export default GraphQLServerOptions;
export declare function resolveGraphqlOptions(options: GraphQLServerOptions | ((...args: Array<any>) => Promise<GraphQLServerOptions> | GraphQLServerOptions), ...args: Array<any>): Promise<GraphQLServerOptions>;
//# sourceMappingURL=graphqlOptions.d.ts.map