"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const apollo_engine_reporting_protobuf_1 = require("apollo-engine-reporting-protobuf");
const apollo_graphql_1 = require("apollo-graphql");
const clientNameHeaderKey = 'apollographql-client-name';
const clientReferenceIdHeaderKey = 'apollographql-client-reference-id';
const clientVersionHeaderKey = 'apollographql-client-version';
class EngineReportingExtension {
    constructor(options, addTrace) {
        this.trace = new apollo_engine_reporting_protobuf_1.Trace();
        this.nodes = new Map();
        this.options = Object.assign({ maskErrorDetails: false }, options);
        this.addTrace = addTrace;
        const root = new apollo_engine_reporting_protobuf_1.Trace.Node();
        this.trace.root = root;
        this.nodes.set(responsePathAsString(undefined), root);
        this.generateClientInfo =
            options.generateClientInfo ||
                (({ request }) => {
                    if (request.http &&
                        request.http.headers &&
                        (request.http.headers.get(clientNameHeaderKey) ||
                            request.http.headers.get(clientVersionHeaderKey) ||
                            request.http.headers.get(clientReferenceIdHeaderKey))) {
                        return {
                            clientName: request.http.headers.get(clientNameHeaderKey),
                            clientVersion: request.http.headers.get(clientVersionHeaderKey),
                            clientReferenceId: request.http.headers.get(clientReferenceIdHeaderKey),
                        };
                    }
                    else if (request.extensions && request.extensions.clientInfo) {
                        return request.extensions.clientInfo;
                    }
                    else {
                        return {};
                    }
                });
    }
    requestDidStart(o) {
        this.trace.startTime = dateToTimestamp(new Date());
        this.startHrTime = process.hrtime();
        this.queryString = o.queryString;
        this.documentAST = o.parsedQuery;
        this.trace.http = new apollo_engine_reporting_protobuf_1.Trace.HTTP({
            method: apollo_engine_reporting_protobuf_1.Trace.HTTP.Method[o.request.method] ||
                apollo_engine_reporting_protobuf_1.Trace.HTTP.Method.UNKNOWN,
            host: null,
            path: null,
        });
        if (this.options.privateHeaders !== true) {
            for (const [key, value] of o.request.headers) {
                if (this.options.privateHeaders &&
                    Array.isArray(this.options.privateHeaders) &&
                    this.options.privateHeaders.some(privateHeader => {
                        return privateHeader.toLowerCase() === key.toLowerCase();
                    })) {
                    continue;
                }
                switch (key) {
                    case 'authorization':
                    case 'cookie':
                    case 'set-cookie':
                        break;
                    default:
                        this.trace.http.requestHeaders[key] = new apollo_engine_reporting_protobuf_1.Trace.HTTP.Values({
                            value: [value],
                        });
                }
            }
            if (o.persistedQueryHit) {
                this.trace.persistedQueryHit = true;
            }
            if (o.persistedQueryRegister) {
                this.trace.persistedQueryRegister = true;
            }
        }
        if (this.options.privateVariables !== true && o.variables) {
            this.trace.details = new apollo_engine_reporting_protobuf_1.Trace.Details();
            Object.keys(o.variables).forEach(name => {
                if (this.options.privateVariables &&
                    Array.isArray(this.options.privateVariables) &&
                    this.options.privateVariables.includes(name)) {
                    this.trace.details.variablesJson[name] = '';
                }
                else {
                    try {
                        this.trace.details.variablesJson[name] = JSON.stringify(o.variables[name]);
                    }
                    catch (e) {
                        this.trace.details.variablesJson[name] = JSON.stringify('[Unable to convert value to JSON]');
                    }
                }
            });
        }
        const clientInfo = this.generateClientInfo(o.requestContext);
        if (clientInfo) {
            const { clientName, clientVersion, clientReferenceId } = clientInfo;
            this.trace.clientVersion = clientVersion || '';
            this.trace.clientReferenceId = clientReferenceId || '';
            this.trace.clientName = clientName || '';
        }
        return () => {
            this.trace.durationNs = durationHrTimeToNanos(process.hrtime(this.startHrTime));
            this.trace.endTime = dateToTimestamp(new Date());
            const operationName = this.operationName || '';
            let signature;
            if (this.documentAST) {
                const calculateSignature = this.options.calculateSignature || apollo_graphql_1.defaultEngineReportingSignature;
                signature = calculateSignature(this.documentAST, operationName);
            }
            else if (this.queryString) {
                signature = this.queryString;
            }
            else {
                throw new Error('No queryString or parsedQuery?');
            }
            this.addTrace(signature, operationName, this.trace);
        };
    }
    executionDidStart(o) {
        if (o.executionArgs.operationName) {
            this.operationName = o.executionArgs.operationName;
        }
        this.documentAST = o.executionArgs.document;
    }
    willResolveField(_source, _args, _context, info) {
        if (this.operationName === undefined) {
            this.operationName =
                (info.operation.name && info.operation.name.value) || '';
        }
        const path = info.path;
        const node = this.newNode(path);
        node.type = info.returnType.toString();
        node.parentType = info.parentType.toString();
        node.startTime = durationHrTimeToNanos(process.hrtime(this.startHrTime));
        return () => {
            node.endTime = durationHrTimeToNanos(process.hrtime(this.startHrTime));
        };
    }
    willSendResponse(o) {
        const { errors } = o.graphqlResponse;
        if (errors) {
            errors.forEach((error) => {
                let node = this.nodes.get('');
                if (error.path) {
                    const specificNode = this.nodes.get(error.path.join('.'));
                    if (specificNode) {
                        node = specificNode;
                    }
                }
                const errorInfo = this.options.maskErrorDetails
                    ? { message: '<masked>' }
                    : {
                        message: error.message,
                        location: (error.locations || []).map(({ line, column }) => new apollo_engine_reporting_protobuf_1.Trace.Location({ line, column })),
                        json: JSON.stringify(error),
                    };
                node.error.push(new apollo_engine_reporting_protobuf_1.Trace.Error(errorInfo));
            });
        }
    }
    newNode(path) {
        const node = new apollo_engine_reporting_protobuf_1.Trace.Node();
        const id = path.key;
        if (typeof id === 'number') {
            node.index = id;
        }
        else {
            node.fieldName = id;
        }
        this.nodes.set(responsePathAsString(path), node);
        const parentNode = this.ensureParentNode(path);
        parentNode.child.push(node);
        return node;
    }
    ensureParentNode(path) {
        const parentPath = responsePathAsString(path.prev);
        const parentNode = this.nodes.get(parentPath);
        if (parentNode) {
            return parentNode;
        }
        return this.newNode(path.prev);
    }
}
exports.EngineReportingExtension = EngineReportingExtension;
function responsePathAsString(p) {
    if (p === undefined) {
        return '';
    }
    return graphql_1.responsePathAsArray(p).join('.');
}
function dateToTimestamp(date) {
    const totalMillis = +date;
    const millis = totalMillis % 1000;
    return new apollo_engine_reporting_protobuf_1.google.protobuf.Timestamp({
        seconds: (totalMillis - millis) / 1000,
        nanos: millis * 1e6,
    });
}
function durationHrTimeToNanos(hrtime) {
    return hrtime[0] * 1e9 + hrtime[1];
}
//# sourceMappingURL=extension.js.map