"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const graphql = __importStar(require("graphql"));
const graphql_extensions_1 = require("graphql-extensions");
const apollo_cache_control_1 = require("apollo-cache-control");
const apollo_tracing_1 = require("apollo-tracing");
const apollo_server_errors_1 = require("apollo-server-errors");
const crypto_1 = require("crypto");
const requestPipelineAPI_1 = require("../dist/requestPipelineAPI");
exports.InvalidGraphQLRequestError = requestPipelineAPI_1.InvalidGraphQLRequestError;
const dispatcher_1 = require("./utils/dispatcher");
function computeQueryHash(query) {
    return crypto_1.createHash('sha256')
        .update(query)
        .digest('hex');
}
function processGraphQLRequest(config, requestContext) {
    return __awaiter(this, void 0, void 0, function* () {
        let cacheControlExtension;
        const extensionStack = initializeExtensionStack();
        requestContext.context._extensionStack = extensionStack;
        const dispatcher = initializeRequestListenerDispatcher();
        initializeDataSources();
        const request = requestContext.request;
        let { query, extensions } = request;
        let queryHash;
        let persistedQueryCache;
        let persistedQueryHit = false;
        let persistedQueryRegister = false;
        if (extensions && extensions.persistedQuery) {
            if (!config.persistedQueries || !config.persistedQueries.cache) {
                throw new apollo_server_errors_1.PersistedQueryNotSupportedError();
            }
            else if (extensions.persistedQuery.version !== 1) {
                throw new requestPipelineAPI_1.InvalidGraphQLRequestError('Unsupported persisted query version');
            }
            persistedQueryCache = config.persistedQueries.cache;
            queryHash = extensions.persistedQuery.sha256Hash;
            if (query === undefined) {
                query = yield persistedQueryCache.get(`apq:${queryHash}`);
                if (query) {
                    persistedQueryHit = true;
                }
                else {
                    throw new apollo_server_errors_1.PersistedQueryNotFoundError();
                }
            }
            else {
                const computedQueryHash = computeQueryHash(query);
                if (queryHash !== computedQueryHash) {
                    throw new requestPipelineAPI_1.InvalidGraphQLRequestError('provided sha does not match query');
                }
                persistedQueryRegister = true;
            }
        }
        else if (query) {
            queryHash = computeQueryHash(query);
        }
        else {
            throw new requestPipelineAPI_1.InvalidGraphQLRequestError('Must provide query string.');
        }
        requestContext.queryHash = queryHash;
        const requestDidEnd = extensionStack.requestDidStart({
            request: request.http,
            queryString: request.query,
            operationName: request.operationName,
            variables: request.variables,
            extensions: request.extensions,
            persistedQueryHit,
            persistedQueryRegister,
            context: requestContext.context,
            requestContext,
        });
        try {
            if (config.documentStore) {
                try {
                    requestContext.document = yield config.documentStore.get(queryHash);
                }
                catch (err) {
                    console.warn('An error occurred while attempting to read from the documentStore.', err);
                }
            }
            if (!requestContext.document) {
                const parsingDidEnd = yield dispatcher.invokeDidStartHook('parsingDidStart', requestContext);
                try {
                    requestContext.document = parse(query);
                    parsingDidEnd();
                }
                catch (syntaxError) {
                    parsingDidEnd(syntaxError);
                    return sendErrorResponse(syntaxError, apollo_server_errors_1.SyntaxError);
                }
                const validationDidEnd = yield dispatcher.invokeDidStartHook('validationDidStart', requestContext);
                const validationErrors = validate(requestContext.document);
                if (validationErrors.length === 0) {
                    validationDidEnd();
                }
                else {
                    validationDidEnd(validationErrors);
                    return sendErrorResponse(validationErrors, apollo_server_errors_1.ValidationError);
                }
                if (config.documentStore) {
                    Promise.resolve(config.documentStore.set(queryHash, requestContext.document)).catch(err => console.warn('Could not store validated document.', err));
                }
            }
            const operation = graphql_1.getOperationAST(requestContext.document, request.operationName);
            requestContext.operation = operation || undefined;
            requestContext.operationName =
                (operation && operation.name && operation.name.value) || null;
            yield dispatcher.invokeHookAsync('didResolveOperation', requestContext);
            if (persistedQueryRegister && persistedQueryCache) {
                Promise.resolve(persistedQueryCache.set(`apq:${queryHash}`, query)).catch(console.warn);
            }
            const executionDidEnd = yield dispatcher.invokeDidStartHook('executionDidStart', requestContext);
            let response;
            try {
                response = (yield execute(requestContext.document, request.operationName, request.variables));
                executionDidEnd();
            }
            catch (executionError) {
                executionDidEnd(executionError);
                return sendErrorResponse(executionError);
            }
            const formattedExtensions = extensionStack.format();
            if (Object.keys(formattedExtensions).length > 0) {
                response.extensions = formattedExtensions;
            }
            if (config.formatResponse) {
                response = config.formatResponse(response, {
                    context: requestContext.context,
                });
            }
            return sendResponse(response);
        }
        finally {
            requestDidEnd();
        }
        function parse(query) {
            const parsingDidEnd = extensionStack.parsingDidStart({
                queryString: query,
            });
            try {
                return graphql.parse(query);
            }
            finally {
                parsingDidEnd();
            }
        }
        function validate(document) {
            let rules = graphql_1.specifiedRules;
            if (config.validationRules) {
                rules = rules.concat(config.validationRules);
            }
            const validationDidEnd = extensionStack.validationDidStart();
            try {
                return graphql.validate(config.schema, document, rules);
            }
            finally {
                validationDidEnd();
            }
        }
        function execute(document, operationName, variables) {
            return __awaiter(this, void 0, void 0, function* () {
                const executionArgs = {
                    schema: config.schema,
                    document,
                    rootValue: typeof config.rootValue === 'function'
                        ? config.rootValue(document)
                        : config.rootValue,
                    contextValue: requestContext.context,
                    variableValues: variables,
                    operationName,
                    fieldResolver: config.fieldResolver,
                };
                const executionDidEnd = extensionStack.executionDidStart({
                    executionArgs,
                });
                try {
                    return graphql.execute(executionArgs);
                }
                finally {
                    executionDidEnd();
                }
            });
        }
        function sendResponse(response) {
            return __awaiter(this, void 0, void 0, function* () {
                requestContext.response = extensionStack.willSendResponse({
                    graphqlResponse: Object.assign({}, requestContext.response, { errors: response.errors, data: response.data, extensions: response.extensions }),
                    context: requestContext.context,
                }).graphqlResponse;
                yield dispatcher.invokeHookAsync('willSendResponse', requestContext);
                return requestContext.response;
            });
        }
        function sendErrorResponse(errorOrErrors, errorClass) {
            const errors = Array.isArray(errorOrErrors)
                ? errorOrErrors
                : [errorOrErrors];
            return sendResponse({
                errors: errors.map(err => apollo_server_errors_1.fromGraphQLError(err, errorClass && {
                    errorClass,
                })),
            });
        }
        function initializeRequestListenerDispatcher() {
            const requestListeners = [];
            if (config.plugins) {
                for (const plugin of config.plugins) {
                    if (!plugin.requestDidStart)
                        continue;
                    const listener = plugin.requestDidStart(requestContext);
                    if (listener) {
                        requestListeners.push(listener);
                    }
                }
            }
            return new dispatcher_1.Dispatcher(requestListeners);
        }
        function initializeExtensionStack() {
            graphql_extensions_1.enableGraphQLExtensions(config.schema);
            const extensions = config.extensions ? config.extensions.map(f => f()) : [];
            if (config.tracing) {
                extensions.push(new apollo_tracing_1.TracingExtension());
            }
            if (config.cacheControl) {
                cacheControlExtension = new apollo_cache_control_1.CacheControlExtension(config.cacheControl);
                extensions.push(cacheControlExtension);
            }
            return new graphql_extensions_1.GraphQLExtensionStack(extensions);
        }
        function initializeDataSources() {
            if (config.dataSources) {
                const context = requestContext.context;
                const dataSources = config.dataSources();
                for (const dataSource of Object.values(dataSources)) {
                    if (dataSource.initialize) {
                        dataSource.initialize({
                            context,
                            cache: requestContext.cache,
                        });
                    }
                }
                if ('dataSources' in context) {
                    throw new Error('Please use the dataSources config option instead of putting dataSources on the context yourself.');
                }
                context.dataSources = dataSources;
            }
        }
    });
}
exports.processGraphQLRequest = processGraphQLRequest;
//# sourceMappingURL=requestPipeline.js.map