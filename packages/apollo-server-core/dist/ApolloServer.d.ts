/// <reference types="node" />
import { Server as HttpServer } from 'http';
import { GraphQLSchema } from 'graphql';
import { ApolloServerPlugin } from 'apollo-server-plugin-base';
import { GraphQLServerOptions as GraphQLOptions } from './graphqlOptions';
import { Config, SubscriptionServerOptions, FileUploadOptions } from './types';
import { PlaygroundRenderPageOptions } from './playground';
import { GraphQLRequest } from './requestPipeline';
export declare class ApolloServerBase {
    subscriptionsPath?: string;
    graphqlPath: string;
    requestOptions: Partial<GraphQLOptions<any>>;
    private context?;
    private engineReportingAgent?;
    private engineServiceId?;
    private extensions;
    private schemaHash;
    protected plugins: ApolloServerPlugin[];
    protected schema: GraphQLSchema;
    protected subscriptionServerOptions?: SubscriptionServerOptions;
    protected uploadsConfig?: FileUploadOptions;
    private subscriptionServer?;
    protected playgroundOptions?: PlaygroundRenderPageOptions;
    private documentStore?;
    constructor(config: Config);
    setGraphQLPath(path: string): void;
    protected willStart(): Promise<void>;
    stop(): Promise<void>;
    installSubscriptionHandlers(server: HttpServer): void;
    protected supportsSubscriptions(): boolean;
    protected supportsUploads(): boolean;
    private ensurePluginInstantiation;
    private initializeDocumentStore;
    protected graphQLServerOptions(integrationContextArgument?: Record<string, any>): Promise<GraphQLOptions<Record<string, any>, any>>;
    executeOperation(request: GraphQLRequest): Promise<import("graphql-extensions").GraphQLResponse>;
}
//# sourceMappingURL=ApolloServer.d.ts.map