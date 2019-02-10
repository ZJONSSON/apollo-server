"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_core_1 = require("apollo-server-core");
const graphql_playground_html_1 = require("@apollographql/graphql-playground-html");
const lambdaApollo_1 = require("./lambdaApollo");
class ApolloServer extends apollo_server_core_1.ApolloServerBase {
    constructor(options) {
        if (process.env.ENGINE_API_KEY || options.engine) {
            options.engine = Object.assign({ sendReportsImmediately: true }, (typeof options.engine !== 'boolean' ? options.engine : {}));
        }
        super(options);
    }
    createGraphQLServerOptions(event, context) {
        return super.graphQLServerOptions({ event, context });
    }
    createHandler({ cors } = { cors: undefined }) {
        const promiseWillStart = this.willStart();
        const corsHeaders = {};
        if (cors) {
            if (cors.methods) {
                if (typeof cors.methods === 'string') {
                    corsHeaders['Access-Control-Allow-Methods'] = cors.methods;
                }
                else if (Array.isArray(cors.methods)) {
                    corsHeaders['Access-Control-Allow-Methods'] = cors.methods.join(',');
                }
            }
            if (cors.allowedHeaders) {
                if (typeof cors.allowedHeaders === 'string') {
                    corsHeaders['Access-Control-Allow-Headers'] = cors.allowedHeaders;
                }
                else if (Array.isArray(cors.allowedHeaders)) {
                    corsHeaders['Access-Control-Allow-Headers'] = cors.allowedHeaders.join(',');
                }
            }
            if (cors.exposedHeaders) {
                if (typeof cors.exposedHeaders === 'string') {
                    corsHeaders['Access-Control-Expose-Headers'] = cors.exposedHeaders;
                }
                else if (Array.isArray(cors.exposedHeaders)) {
                    corsHeaders['Access-Control-Expose-Headers'] = cors.exposedHeaders.join(',');
                }
            }
            if (cors.credentials) {
                corsHeaders['Access-Control-Allow-Credentials'] = 'true';
            }
            if (cors.maxAge) {
                corsHeaders['Access-Control-Max-Age'] = cors.maxAge;
            }
        }
        return (event, context, callback) => {
            if (cors && cors.origin) {
                if (typeof cors.origin === 'string') {
                    corsHeaders['Access-Control-Allow-Origin'] = cors.origin;
                }
                else if (typeof cors.origin === 'boolean' ||
                    (Array.isArray(cors.origin) &&
                        cors.origin.includes(event.headers['Origin'] || event.headers['origin']))) {
                    corsHeaders['Access-Control-Allow-Origin'] =
                        event.headers['Origin'] || event.headers['origin'];
                }
                if (!cors.allowedHeaders) {
                    corsHeaders['Access-Control-Allow-Headers'] =
                        event.headers['Access-Control-Request-Headers'];
                }
            }
            if (event.httpMethod === 'OPTIONS') {
                return callback(null, {
                    body: '',
                    statusCode: 204,
                    headers: corsHeaders,
                });
            }
            if (this.playgroundOptions && event.httpMethod === 'GET') {
                const acceptHeader = event.headers['Accept'] || event.headers['accept'];
                if (acceptHeader && acceptHeader.includes('text/html')) {
                    const path = event.path ||
                        (event.requestContext && event.requestContext.path) ||
                        '/';
                    const playgroundRenderPageOptions = Object.assign({ endpoint: path }, this.playgroundOptions);
                    return callback(null, {
                        body: graphql_playground_html_1.renderPlaygroundPage(playgroundRenderPageOptions),
                        statusCode: 200,
                        headers: Object.assign({ 'Content-Type': 'text/html' }, corsHeaders),
                    });
                }
            }
            const callbackFilter = (error, result) => {
                callback(error, result && Object.assign({}, result, { headers: Object.assign({}, result.headers, corsHeaders) }));
            };
            lambdaApollo_1.graphqlLambda(() => __awaiter(this, void 0, void 0, function* () {
                yield promiseWillStart;
                return this.createGraphQLServerOptions(event, context);
            }))(event, context, callbackFilter);
        };
    }
}
exports.ApolloServer = ApolloServer;
//# sourceMappingURL=ApolloServer.js.map