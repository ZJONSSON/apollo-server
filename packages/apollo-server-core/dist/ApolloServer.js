"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_tools_1 = require("graphql-tools");
const graphql_1 = require("graphql");
const apollo_engine_reporting_1 = require("apollo-engine-reporting");
const apollo_server_caching_1 = require("apollo-server-caching");
const runtimeSupportsUploads_1 = __importDefault(require("./utils/runtimeSupportsUploads"));
const subscriptions_transport_ws_1 = require("subscriptions-transport-ws");
const apollo_server_errors_1 = require("apollo-server-errors");
const formatters_1 = require("./formatters");
const index_1 = require("./index");
const playground_1 = require("./playground");
const schemaHash_1 = require("./utils/schemaHash");
const requestPipeline_1 = require("./requestPipeline");
const apollo_server_env_1 = require("apollo-server-env");
const apollo_tools_1 = require("@apollographql/apollo-tools");
const NoIntrospection = (context) => ({
    Field(node) {
        if (node.name.value === '__schema' || node.name.value === '__type') {
            context.reportError(new graphql_1.GraphQLError('GraphQL introspection is not allowed by Apollo Server, but the query contained __schema or __type. To enable introspection, pass introspection: true to ApolloServer in production', [node]));
        }
    },
});
function getEngineServiceId(engine) {
    const keyFromEnv = process.env.ENGINE_API_KEY || '';
    if (!(engine || (engine !== false && keyFromEnv))) {
        return;
    }
    let engineApiKey = '';
    if (typeof engine === 'object' && engine.apiKey) {
        engineApiKey = engine.apiKey;
    }
    else if (keyFromEnv) {
        engineApiKey = keyFromEnv;
    }
    if (engineApiKey) {
        return engineApiKey.split(':', 2)[1];
    }
    return;
}
const forbidUploadsForTesting = process && process.env.NODE_ENV === 'test' && !runtimeSupportsUploads_1.default;
function approximateObjectSize(obj) {
    return Buffer.byteLength(JSON.stringify(obj), 'utf8');
}
class ApolloServerBase {
    constructor(config) {
        this.graphqlPath = '/graphql';
        this.requestOptions = Object.create(null);
        this.plugins = [];
        if (!config)
            throw new Error('ApolloServer requires options.');
        const { context, resolvers, schema, schemaDirectives, modules, typeDefs, introspection, mocks, mockEntireSchema, extensions, engine, subscriptions, uploads, playground, plugins } = config, requestOptions = __rest(config, ["context", "resolvers", "schema", "schemaDirectives", "modules", "typeDefs", "introspection", "mocks", "mockEntireSchema", "extensions", "engine", "subscriptions", "uploads", "playground", "plugins"]);
        this.initializeDocumentStore();
        this.ensurePluginInstantiation(plugins);
        const isDev = process.env.NODE_ENV !== 'production';
        if ((typeof introspection === 'boolean' && !introspection) ||
            (introspection === undefined && !isDev)) {
            const noIntro = [NoIntrospection];
            requestOptions.validationRules = requestOptions.validationRules
                ? requestOptions.validationRules.concat(noIntro)
                : noIntro;
        }
        if (requestOptions.cacheControl !== false) {
            if (typeof requestOptions.cacheControl === 'boolean' &&
                requestOptions.cacheControl === true) {
                requestOptions.cacheControl = {
                    stripFormattedExtensions: false,
                    calculateHttpHeaders: false,
                    defaultMaxAge: 0,
                };
            }
            else {
                requestOptions.cacheControl = Object.assign({ stripFormattedExtensions: true, calculateHttpHeaders: true, defaultMaxAge: 0 }, requestOptions.cacheControl);
            }
        }
        if (!requestOptions.cache) {
            requestOptions.cache = new apollo_server_caching_1.InMemoryLRUCache();
        }
        if (requestOptions.persistedQueries !== false) {
            if (!requestOptions.persistedQueries) {
                requestOptions.persistedQueries = {
                    cache: requestOptions.cache,
                };
            }
        }
        else {
            delete requestOptions.persistedQueries;
        }
        this.requestOptions = requestOptions;
        this.context = context;
        if (uploads !== false && !forbidUploadsForTesting) {
            if (this.supportsUploads()) {
                if (!runtimeSupportsUploads_1.default) {
                    printNodeFileUploadsMessage();
                    throw new Error('`graphql-upload` is no longer supported on Node.js < v8.5.0.  ' +
                        'See https://bit.ly/gql-upload-node-6.');
                }
                if (uploads === true || typeof uploads === 'undefined') {
                    this.uploadsConfig = {};
                }
                else {
                    this.uploadsConfig = uploads;
                }
            }
            else if (uploads) {
                throw new Error('This implementation of ApolloServer does not support file uploads because the environment cannot accept multi-part forms');
            }
        }
        if (schema) {
            this.schema = schema;
        }
        else if (modules) {
            const { schema, errors } = apollo_tools_1.buildServiceDefinition(modules);
            if (errors && errors.length > 0) {
                throw new Error(errors.map(error => error.message).join('\n\n'));
            }
            this.schema = schema;
        }
        else {
            if (!typeDefs) {
                throw Error('Apollo Server requires either an existing schema, modules or typeDefs');
            }
            let augmentedTypeDefs = Array.isArray(typeDefs) ? typeDefs : [typeDefs];
            augmentedTypeDefs.push(index_1.gql `
          enum CacheControlScope {
            PUBLIC
            PRIVATE
          }

          directive @cacheControl(
            maxAge: Int
            scope: CacheControlScope
          ) on FIELD_DEFINITION | OBJECT | INTERFACE
        `);
            if (this.uploadsConfig) {
                const { GraphQLUpload } = require('graphql-upload');
                if (resolvers && !resolvers.Upload) {
                    resolvers.Upload = GraphQLUpload;
                }
                augmentedTypeDefs.push(index_1.gql `
            scalar Upload
          `);
            }
            this.schema = graphql_tools_1.makeExecutableSchema({
                typeDefs: augmentedTypeDefs,
                schemaDirectives,
                resolvers,
            });
        }
        if (mocks || (typeof mockEntireSchema !== 'undefined' && mocks !== false)) {
            graphql_tools_1.addMockFunctionsToSchema({
                schema: this.schema,
                mocks: typeof mocks === 'boolean' || typeof mocks === 'undefined'
                    ? {}
                    : mocks,
                preserveResolvers: typeof mockEntireSchema === 'undefined' ? false : !mockEntireSchema,
            });
        }
        this.schemaHash = schemaHash_1.generateSchemaHash(this.schema);
        this.extensions = [];
        const debugDefault = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';
        const debug = requestOptions.debug !== undefined ? requestOptions.debug : debugDefault;
        this.extensions.push(() => new formatters_1.FormatErrorExtension(requestOptions.formatError, debug));
        this.engineServiceId = getEngineServiceId(engine);
        if (this.engineServiceId) {
            this.engineReportingAgent = new apollo_engine_reporting_1.EngineReportingAgent(typeof engine === 'object' ? engine : Object.create(null), {
                schema: this.schema,
                schemaHash: this.schemaHash,
                engine: {
                    serviceID: this.engineServiceId,
                },
            });
            this.extensions.push(() => this.engineReportingAgent.newExtension());
        }
        if (extensions) {
            this.extensions = [...this.extensions, ...extensions];
        }
        if (subscriptions !== false) {
            if (this.supportsSubscriptions()) {
                if (subscriptions === true || typeof subscriptions === 'undefined') {
                    this.subscriptionServerOptions = {
                        path: this.graphqlPath,
                    };
                }
                else if (typeof subscriptions === 'string') {
                    this.subscriptionServerOptions = { path: subscriptions };
                }
                else {
                    this.subscriptionServerOptions = Object.assign({ path: this.graphqlPath }, subscriptions);
                }
                this.subscriptionsPath = this.subscriptionServerOptions.path;
            }
            else if (subscriptions) {
                throw new Error('This implementation of ApolloServer does not support GraphQL subscriptions.');
            }
        }
        this.playgroundOptions = playground_1.createPlaygroundOptions(playground);
    }
    setGraphQLPath(path) {
        this.graphqlPath = path;
    }
    willStart() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(this.plugins.map(plugin => plugin.serverWillStart &&
                plugin.serverWillStart({
                    schema: this.schema,
                    schemaHash: this.schemaHash,
                    engine: {
                        serviceID: this.engineServiceId,
                    },
                    persistedQueries: this.requestOptions.persistedQueries,
                })));
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.subscriptionServer)
                yield this.subscriptionServer.close();
            if (this.engineReportingAgent) {
                this.engineReportingAgent.stop();
                yield this.engineReportingAgent.sendReport();
            }
        });
    }
    installSubscriptionHandlers(server) {
        if (!this.subscriptionServerOptions) {
            if (this.supportsSubscriptions()) {
                throw Error('Subscriptions are disabled, due to subscriptions set to false in the ApolloServer constructor');
            }
            else {
                throw Error('Subscriptions are not supported, choose an integration, such as apollo-server-express that allows persistent connections');
            }
        }
        const { onDisconnect, onConnect, keepAlive, path, } = this.subscriptionServerOptions;
        this.subscriptionServer = subscriptions_transport_ws_1.SubscriptionServer.create({
            schema: this.schema,
            execute: graphql_1.execute,
            subscribe: graphql_1.subscribe,
            onConnect: onConnect
                ? onConnect
                : (connectionParams) => (Object.assign({}, connectionParams)),
            onDisconnect: onDisconnect,
            onOperation: (message, connection) => __awaiter(this, void 0, void 0, function* () {
                connection.formatResponse = (value) => (Object.assign({}, value, { errors: value.errors &&
                        apollo_server_errors_1.formatApolloErrors([...value.errors], {
                            formatter: this.requestOptions.formatError,
                            debug: this.requestOptions.debug,
                        }) }));
                let context = this.context ? this.context : { connection };
                try {
                    context =
                        typeof this.context === 'function'
                            ? yield this.context({ connection, payload: message.payload })
                            : context;
                }
                catch (e) {
                    throw apollo_server_errors_1.formatApolloErrors([e], {
                        formatter: this.requestOptions.formatError,
                        debug: this.requestOptions.debug,
                    })[0];
                }
                return Object.assign({}, connection, { context });
            }),
            keepAlive,
        }, {
            server,
            path,
        });
    }
    supportsSubscriptions() {
        return false;
    }
    supportsUploads() {
        return false;
    }
    ensurePluginInstantiation(plugins) {
        if (!plugins || !plugins.length) {
            return;
        }
        this.plugins = plugins.map(plugin => {
            if (typeof plugin === 'function') {
                return plugin();
            }
            return plugin;
        });
    }
    initializeDocumentStore() {
        this.documentStore = new apollo_server_caching_1.InMemoryLRUCache({
            maxSize: Math.pow(2, 20) * 30,
            sizeCalculator: approximateObjectSize,
        });
    }
    graphQLServerOptions(integrationContextArgument) {
        return __awaiter(this, void 0, void 0, function* () {
            let context = this.context ? this.context : {};
            try {
                context =
                    typeof this.context === 'function'
                        ? yield this.context(integrationContextArgument || {})
                        : context;
            }
            catch (error) {
                context = () => {
                    throw error;
                };
            }
            return Object.assign({ schema: this.schema, plugins: this.plugins, documentStore: this.documentStore, extensions: this.extensions, context, persistedQueries: this.requestOptions
                    .persistedQueries, fieldResolver: this.requestOptions.fieldResolver }, this.requestOptions);
        });
    }
    executeOperation(request) {
        return __awaiter(this, void 0, void 0, function* () {
            let options;
            try {
                options = yield this.graphQLServerOptions();
            }
            catch (e) {
                e.message = `Invalid options provided to ApolloServer: ${e.message}`;
                throw new Error(e);
            }
            if (typeof options.context === 'function') {
                options.context = options.context();
            }
            const requestCtx = {
                request,
                context: options.context || Object.create(null),
                cache: options.cache,
                response: {
                    http: {
                        headers: new apollo_server_env_1.Headers(),
                    },
                },
            };
            return requestPipeline_1.processGraphQLRequest(options, requestCtx);
        });
    }
}
exports.ApolloServerBase = ApolloServerBase;
function printNodeFileUploadsMessage() {
    console.error([
        '*****************************************************************',
        '*                                                               *',
        '* ERROR! Manual intervention is necessary for Node.js < v8.5.0! *',
        '*                                                               *',
        '*****************************************************************',
        '',
        'The third-party `graphql-upload` package, which is used to implement',
        'file uploads in Apollo Server 2.x, no longer supports Node.js LTS',
        'versions prior to Node.js v8.5.0.',
        '',
        'Deployments which NEED file upload capabilities should update to',
        'Node.js >= v8.5.0 to continue using uploads.',
        '',
        'If this server DOES NOT NEED file uploads and wishes to continue',
        'using this version of Node.js, uploads can be disabled by adding:',
        '',
        '  uploads: false,',
        '',
        '...to the options for Apollo Server and re-deploying the server.',
        '',
        'For more information, see https://bit.ly/gql-upload-node-6.',
        '',
    ].join('\n'));
}
//# sourceMappingURL=ApolloServer.js.map