"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_core_1 = require("apollo-server-core");
const apollo_server_env_1 = require("apollo-server-env");
function graphqlAzureFunction(options) {
    if (!options) {
        throw new Error('Apollo Server requires options.');
    }
    if (arguments.length > 1) {
        throw new Error(`Apollo Server expects exactly one argument, got ${arguments.length}`);
    }
    const graphqlHandler = (context, request, callback) => {
        if (request.method === 'POST' && !request.body) {
            callback(null, {
                body: 'POST body missing.',
                status: 500,
            });
            return;
        }
        apollo_server_core_1.runHttpQuery([request, context], {
            method: request.method,
            options: options,
            query: request.method === 'POST' && request.body
                ? request.body
                : request.query,
            request: {
                url: request.originalUrl,
                method: request.method,
                headers: new apollo_server_env_1.Headers(request.headers),
            },
        }).then(({ graphqlResponse, responseInit }) => {
            callback(null, {
                body: graphqlResponse,
                status: 200,
                headers: responseInit.headers,
            });
        }, (error) => {
            if ('HttpQueryError' !== error.name) {
                callback(error);
            }
            else {
                callback(null, {
                    body: error.message,
                    status: error.statusCode,
                    headers: error.headers,
                });
            }
        });
    };
    return graphqlHandler;
}
exports.graphqlAzureFunction = graphqlAzureFunction;
//# sourceMappingURL=azureFunctionApollo.js.map