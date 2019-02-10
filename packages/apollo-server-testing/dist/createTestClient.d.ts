import { ApolloServerBase } from 'apollo-server-core';
import { DocumentNode } from 'graphql';
declare type StringOrAst = string | DocumentNode;
declare type Query = {
    query: StringOrAst;
    mutation?: undefined;
};
declare type Mutation = {
    mutation: StringOrAst;
    query?: undefined;
};
declare const _default: (server: ApolloServerBase) => {
    query: ({ query, mutation, ...args }: Query | Mutation) => Promise<import("graphql-extensions").GraphQLResponse>;
    mutate: ({ query, mutation, ...args }: Query | Mutation) => Promise<import("graphql-extensions").GraphQLResponse>;
};
export default _default;
//# sourceMappingURL=createTestClient.d.ts.map