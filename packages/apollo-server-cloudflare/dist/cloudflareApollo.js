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
const apollo_server_env_1 = require("apollo-server-env");
function graphqlCloudflare(options) {
    if (!options) {
        throw new Error('Apollo Server requires options.');
    }
    if (arguments.length > 1) {
        throw new Error(`Apollo Server expects exactly one argument, got ${arguments.length}`);
    }
    const graphqlHandler = (req) => __awaiter(this, void 0, void 0, function* () {
        const url = new apollo_server_env_1.URL(req.url);
        const query = req.method === 'POST'
            ? yield req.json()
            : {
                query: url.searchParams.get('query'),
                variables: url.searchParams.get('variables'),
                operationName: url.searchParams.get('operationName'),
                extensions: url.searchParams.get('extensions'),
            };
        return apollo_server_core_1.runHttpQuery([req], {
            method: req.method,
            options: options,
            query,
            request: req,
        }).then(({ graphqlResponse, responseInit }) => new apollo_server_env_1.Response(graphqlResponse, responseInit), (error) => {
            if ('HttpQueryError' !== error.name)
                throw error;
            const res = new apollo_server_env_1.Response(error.message, {
                status: error.statusCode,
                headers: error.headers,
            });
            return res;
        });
    });
    return graphqlHandler;
}
exports.graphqlCloudflare = graphqlCloudflare;
//# sourceMappingURL=cloudflareApollo.js.map