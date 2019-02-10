import { GraphQLOptions } from 'apollo-server-core';
import { Request, Response } from 'apollo-server-env';
export interface CloudflareOptionsFunction {
    (req?: Request): GraphQLOptions | Promise<GraphQLOptions>;
}
export declare function graphqlCloudflare(options: GraphQLOptions | CloudflareOptionsFunction): (req: Request) => Promise<Response>;
//# sourceMappingURL=cloudflareApollo.d.ts.map