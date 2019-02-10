"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = __importDefault(require("redis"));
const util_1 = require("util");
const dataloader_1 = __importDefault(require("dataloader"));
class RedisCache {
    constructor(options) {
        this.defaultSetOptions = {
            ttl: 300,
        };
        const client = redis_1.default.createClient(options);
        client.del = util_1.promisify(client.del).bind(client);
        client.mget = util_1.promisify(client.mget).bind(client);
        client.set = util_1.promisify(client.set).bind(client);
        client.flushdb = util_1.promisify(client.flushdb).bind(client);
        client.quit = util_1.promisify(client.quit).bind(client);
        this.client = client;
        this.loader = new dataloader_1.default(keys => this.client.mget(keys), {
            cache: false,
        });
    }
    set(key, value, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { ttl } = Object.assign({}, this.defaultSetOptions, options);
            yield this.client.set(key, value, 'EX', ttl);
        });
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const reply = yield this.loader.load(key);
            if (reply !== null) {
                return reply;
            }
            return;
        });
    }
    delete(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.client.del(key);
        });
    }
    flush() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.flushdb();
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.quit();
            return;
        });
    }
}
exports.RedisCache = RedisCache;
//# sourceMappingURL=index.js.map