'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request-promise");
const AccessToken_1 = require("./models/AccessToken");
class SquidexImporter {
    constructor(options) {
        this.squidexId = options.squidexId;
        this.squidexSecret = options.squidexSecret;
        this.squidexAuthEndpoint = options.squidexAuthEndpoint;
        this.squidexApiBaseUrl = options.squidexApiBaseUrl;
        this.autoPublish = false;
        this.autoPaginate = false;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            this.squidexAccessToken = yield this.getAccessToken();
            return this.squidexAccessToken;
        });
    }
    search(schema, content, field, equals, order, direction) {
        return __awaiter(this, void 0, void 0, function* () {
            let criteria = (isNaN(equals)) ? `?$filter=data/${field}/iv eq '${equals}'` : `?$filter=data/${field}/iv eq ${equals}`;
            if (order && direction) {
                criteria = (isNaN(equals)) ? `?$filter=data/${field}/iv eq '${equals}'` : `?$filter=data/${field}/iv eq ${equals}&$orderby='data/${order}/iv ${direction}'`;
            }
            return this.searchOnCriteria(schema, content, field, equals, criteria);
        });
    }
    query(schema, content, query) {
        return __awaiter(this, void 0, void 0, function* () {
            let criteria = '?$filter=';
            const queryKeys = Object.keys(query);
            queryKeys.forEach(key => {
                if (isNaN(query[key])) {
                    criteria += `data/${key}/iv eq '${query[key]}' and `;
                }
                else {
                    criteria += `data/${key}/iv eq ${query[key]} and `;
                }
            });
            criteria = criteria.trim();
            criteria = criteria.slice(0, -4);
            return this.getOnCriteria(schema, content, criteria);
        });
    }
    getByPk(schema, content, pk) {
        return __awaiter(this, void 0, void 0, function* () {
            const criteria = `?$filter=id eq '${pk}'`;
            const url = `${this.squidexApiBaseUrl}/${schema}/${content}${criteria}`;
            const options = this.getRequestOptions('GET', url, {}, this.squidexAccessToken.accessToken);
            const preResult = yield request(options)
                .catch((error) => {
                console.log(`Error while searching record ${JSON.stringify(pk)} from schema: ${schema} and content: ${content}`);
                console.log(error.error);
                return null;
            });
            const result = [];
            preResult.items.forEach(item => {
                const data = item.data;
                const id = item.id;
                const dataKeys = Object.keys(data);
                const transformedItem = {
                    _id: id
                };
                dataKeys.forEach(key => {
                    transformedItem[key] = data[key].iv;
                });
                result.push(transformedItem);
            });
            if (result.length > 0) {
                return result[0];
            }
            else {
                return -1;
            }
        });
    }
    get(schema, content, order, direction) {
        return __awaiter(this, void 0, void 0, function* () {
            const criteria = `?$orderby=data/${order}/iv ${direction}`;
            if (order && direction) {
                return this.getOnCriteria(schema, content, criteria);
            }
            return this.getOnCriteria(schema, content, '');
        });
    }
    insert(schema, content, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const insertQuery = this.prepareInsertArguments(data);
            const publishParam = (this.autoPublish) ? '?publish=true' : '';
            const url = `${this.squidexApiBaseUrl}/${schema}/${content}${publishParam}`;
            const options = this.getRequestOptions('POST', url, insertQuery, this.squidexAccessToken.accessToken);
            return request(options)
                .catch((error) => {
                console.log(`Error while inserting record ${JSON.stringify(data)} from schema: ${schema} and content: ${content}`);
                console.log(error.error);
                return null;
            });
        });
    }
    update(schema, content, recordId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const updateQuery = this.prepareInsertArguments(data);
            const url = `${this.squidexApiBaseUrl}/${schema}/${content}/${recordId}`;
            const options = this.getRequestOptions('PUT', url, updateQuery, this.squidexAccessToken.accessToken);
            request(options)
                .catch((error) => {
                console.log(`Error while updating record ${JSON.stringify(data)} from schema: ${schema} and content: ${content}`);
                console.log(error.error);
                return null;
            });
        });
    }
    delete(schema, content, recordId) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${this.squidexApiBaseUrl}/${schema}/${content}/${recordId}`;
            const options = this.getRequestOptions('DELETE', url, {}, this.squidexAccessToken.accessToken);
            request(options)
                .catch((error) => {
                console.log(`Error while deleting record ${recordId} from schema: ${schema} and content: ${content}`);
                console.log(error);
                return null;
            });
        });
    }
    setAutoPublish(autoPublish) {
        this.autoPublish = autoPublish;
    }
    setAutoPaginate(autoPaginate) {
        this.autoPaginate = autoPaginate;
    }
    getOnCriteria(schema, content, criteria) {
        return __awaiter(this, void 0, void 0, function* () {
            let originalUrl = `${this.squidexApiBaseUrl}/${schema}/${content}${criteria}`;
            let options = this.getRequestOptions('GET', originalUrl, {}, this.squidexAccessToken.accessToken);
            let preResult = yield request(options)
                .catch((error) => {
                console.log(`Error while getting records from schema: ${schema} and content: ${content}`);
                console.log(error.error);
                return null;
            });
            const result = [];
            this.agregateResults(preResult, result);
            // the pagination
            if (this.autoPaginate) {
                if (preResult.total >= 200) {
                    const totalPages = Math.ceil((preResult.total / 200));
                    for (let i = 1; i < totalPages; i++) {
                        const skip = (i * 200);
                        let url;
                        if (criteria) {
                            url = `${originalUrl}&$top=200&$skip=${skip}`;
                        }
                        else {
                            url = `${originalUrl}?$top=200&$skip=${skip}`;
                        }
                        options = this.getRequestOptions('GET', url, {}, this.squidexAccessToken.accessToken);
                        preResult = yield request(options)
                            .catch((error) => {
                            console.log(`Error while getting records from schema: ${schema} and content: ${content} on page: ${i}`);
                            console.log(error.error);
                            return null;
                        });
                        this.agregateResults(preResult, result);
                    }
                }
            }
            return result;
        });
    }
    searchOnCriteria(schema, content, field, equals, criteria) {
        return __awaiter(this, void 0, void 0, function* () {
            let originalUrl = `${this.squidexApiBaseUrl}/${schema}/${content}${criteria}`;
            let options = this.getRequestOptions('GET', originalUrl, {}, this.squidexAccessToken.accessToken);
            let preResult = yield request(options)
                .catch((error) => {
                console.log(`Error while searching record ${JSON.stringify(equals)} from schema: ${schema} and content: ${content}`);
                console.log(error.error);
                return null;
            });
            const result = [];
            this.agregateResults(preResult, result);
            // the pagination
            if (this.autoPaginate) {
                if (preResult.total >= 200) {
                    const totalPages = Math.ceil((preResult.total / 200));
                    for (let i = 1; i < totalPages; i++) {
                        const skip = (i * 200);
                        let url;
                        if (criteria) {
                            let url = `${originalUrl}&$top=200&$skip=${skip}`;
                        }
                        else {
                            let url = `${originalUrl}?$top=200&$skip=${skip}`;
                        }
                        options = this.getRequestOptions('GET', url, {}, this.squidexAccessToken.accessToken);
                        preResult = yield request(options)
                            .catch((error) => {
                            console.log(`Error while searching record ${JSON.stringify(equals)} from schema: ${schema} and content: ${content} on page: ${i}`);
                            console.log(error.error);
                            return null;
                        });
                        this.agregateResults(preResult, result);
                    }
                }
            }
            return result;
        });
    }
    agregateResults(preResult, result) {
        preResult.items.forEach(item => {
            const data = item.data;
            const id = item.id;
            const dataKeys = Object.keys(data);
            const transformedItem = {
                _id: id
            };
            dataKeys.forEach(key => {
                transformedItem[key] = data[key].iv;
            });
            result.push(transformedItem);
        });
    }
    prepareInsertArguments(criteria) {
        const keys = Object.keys(criteria);
        const query = {};
        keys.map(key => {
            query[key] = {
                'iv': criteria[key]
            };
        });
        return query;
    }
    getAccessToken() {
        return __awaiter(this, void 0, void 0, function* () {
            const options = {
                method: 'POST',
                url: this.squidexAuthEndpoint,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                form: {
                    grant_type: 'client_credentials',
                    client_id: this.squidexId,
                    client_secret: this.squidexSecret,
                    scope: 'squidex-api',
                },
                json: true,
            };
            const response = yield request(options)
                .catch((error) => {
                console.log('Error while getting cms access token');
                console.log(error);
                return null;
            });
            return new AccessToken_1.AccessToken(response.access_token, response.expires_in, response.token_type);
        });
    }
    getRequestOptions(method, url, body, accessToken) {
        return {
            method,
            url,
            headers: {
                'cache-control': 'no-cache',
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                accept: 'application/json',
            },
            body,
            json: true,
        };
    }
}
exports.SquidexImporter = SquidexImporter;
