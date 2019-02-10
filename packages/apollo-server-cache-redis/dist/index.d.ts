import { KeyValueCache } from 'apollo-server-caching';
import Redis from 'redis';
export declare class RedisCache implements KeyValueCache<string> {
    readonly client: any;
    readonly defaultSetOptions: {
        ttl: number;
    };
    private loader;
    constructor(options: Redis.ClientOpts);
    set(key: string, value: string, options?: {
        ttl?: number;
    }): Promise<void>;
    get(key: string): Promise<string | undefined>;
    delete(key: string): Promise<boolean>;
    flush(): Promise<void>;
    close(): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map