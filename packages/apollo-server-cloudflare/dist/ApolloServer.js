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
const cloudflareApollo_1 = require("./cloudflareApollo");
const apollo_server_core_1 = require("apollo-server-core");
var apollo_server_core_2 = require("apollo-server-core");
exports.GraphQLExtension = apollo_server_core_2.GraphQLExtension;
class ApolloServer extends apollo_server_core_1.ApolloServerBase {
    createGraphQLServerOptions(request) {
        const _super = Object.create(null, {
            graphQLServerOptions: { get: () => super.graphQLServerOptions }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return _super.graphQLServerOptions.call(this, { request });
        });
    }
    listen() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.willStart();
            addEventListener('fetch', (event) => {
                event.respondWith(cloudflareApollo_1.graphqlCloudflare(() => {
                    return this.createGraphQLServerOptions(event.request);
                })(event.request));
            });
            return yield { url: '', port: null };
        });
    }
}
exports.ApolloServer = ApolloServer;
//# sourceMappingURL=ApolloServer.js.map