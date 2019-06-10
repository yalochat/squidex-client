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
const index_1 = require("../index");
const nock = require("nock");
const chai_1 = require("chai");
require("mocha");
const fakeId = 'app:content';
const fakeSecret = 'secret-key';
const fakeAuthEndpoint = 'https://squidex.com/identity-server/connect/token';
const fakeSquidexApiBaseUrl = 'https://squidex.com/api/content';
describe('Test importer', () => {
    it('Constructor should not return null', () => __awaiter(this, void 0, void 0, function* () {
        const squidexImporter = new index_1.SquidexImporter({
            squidexId: fakeId,
            squidexSecret: fakeSecret,
            squidexAuthEndpoint: fakeAuthEndpoint,
            squidexApiBaseUrl: fakeSquidexApiBaseUrl
        });
        chai_1.expect(squidexImporter).to.not.equal(null);
    }));
    it('Connect returns an access token', () => __awaiter(this, void 0, void 0, function* () {
        nock('https://squidex.com')
            .post('/identity-server/connect/token')
            .reply(200, {
            access_token: 'some-access-token',
            expores_in: 2592000,
            token_type: 'Bearer'
        });
        const squidexImporter = new index_1.SquidexImporter({
            squidexId: fakeId,
            squidexSecret: fakeSecret,
            squidexAuthEndpoint: fakeAuthEndpoint,
            squidexApiBaseUrl: fakeSquidexApiBaseUrl
        });
        const accessToken = yield squidexImporter.connect();
        chai_1.expect(accessToken.accessToken).to.equal('some-access-token');
    }));
    it('Can search content from squidex', () => __awaiter(this, void 0, void 0, function* () {
        nock('https://squidex.com')
            .post('/identity-server/connect/token')
            .reply(200, {
            access_token: 'some-access-token',
            expores_in: 2592000,
            token_type: 'Bearer'
        });
        nock('https://squidex.com')
            .get('/api/content/some/clients?$filter=data/CNPJ/iv%20eq%2030560848000136')
            .reply(200, {
            "total": 1,
            "items": [
                {
                    "id": "76bf20c6-c834-466a-a07d-c7e276a28cec",
                    "createdBy": "client:fake:client",
                    "lastModifiedBy": "client:fake:client",
                    "data": {
                        "CNPJ": {
                            "iv": 30560848000136
                        },
                    },
                    "isPending": false,
                    "created": "2019-05-14T20:26:04Z",
                    "lastModified": "2019-05-14T20:26:04Z",
                    "status": "Published",
                    "version": 1
                }
            ]
        });
        const squidexConnection = {
            squidexId: fakeId,
            squidexSecret: fakeSecret,
            squidexAuthEndpoint: fakeAuthEndpoint,
            squidexApiBaseUrl: fakeSquidexApiBaseUrl
        };
        const importer = new index_1.SquidexImporter(squidexConnection);
        yield importer.connect();
        const result = yield importer.search('some', 'clients', 'CNPJ', '30560848000136');
        chai_1.expect(result[0].CNPJ).to.equal(30560848000136);
    }));
    it('Can get all content from squidex', () => __awaiter(this, void 0, void 0, function* () {
        nock('https://squidex.com')
            .post('/identity-server/connect/token')
            .reply(200, {
            access_token: 'some-access-token',
            expores_in: 2592000,
            token_type: 'Bearer'
        });
        nock('https://squidex.com')
            .get('/api/content/some/clients')
            .reply(200, {
            "total": 1,
            "items": [
                {
                    "id": "76bf20c6-c834-466a-a07d-c7e276a28cec",
                    "createdBy": "client:fake:client",
                    "lastModifiedBy": "client:fake:client",
                    "data": {
                        "CNPJ": {
                            "iv": 30560848000136
                        },
                    },
                    "isPending": false,
                    "created": "2019-05-14T20:26:04Z",
                    "lastModified": "2019-05-14T20:26:04Z",
                    "status": "Published",
                    "version": 1
                }
            ]
        });
        const squidexConnection = {
            squidexId: fakeId,
            squidexSecret: fakeSecret,
            squidexAuthEndpoint: fakeAuthEndpoint,
            squidexApiBaseUrl: fakeSquidexApiBaseUrl
        };
        const importer = new index_1.SquidexImporter(squidexConnection);
        yield importer.connect();
        const result = yield importer.get('some', 'clients');
        chai_1.expect(result[0].CNPJ).to.equal(30560848000136);
    }));
    it('Inserts a record and autopublish it', () => __awaiter(this, void 0, void 0, function* () {
        nock('https://squidex.com')
            .post('/identity-server/connect/token')
            .reply(200, {
            access_token: 'some-access-token',
            expores_in: 2592000,
            token_type: 'Bearer'
        });
        nock('https://squidex.com')
            .post('/api/content/umbrela/zombies?publish=true')
            .reply(200, {
            id: 123456,
            data: {
                name: {
                    iv: 'Tyrant'
                },
                type: {
                    iv: 'Mutant'
                }
            }
        });
        const squidexImporter = new index_1.SquidexImporter({
            squidexId: fakeId,
            squidexSecret: fakeSecret,
            squidexAuthEndpoint: fakeAuthEndpoint,
            squidexApiBaseUrl: fakeSquidexApiBaseUrl
        });
        yield squidexImporter.connect();
        squidexImporter.setAutoPublish(true);
        const insertResult = yield squidexImporter.insert('umbrela', 'zombies', {
            name: 'Tyrant',
            type: 'Mutant'
        });
        chai_1.expect(insertResult.id).to.equal(123456);
    }));
    it('Can search by primary key', () => __awaiter(this, void 0, void 0, function* () {
        // TODO: add nock test
        nock('https://squidex.com')
            .post('/identity-server/connect/token')
            .reply(200, {
            access_token: 'some-access-token',
            expores_in: 2592000,
            token_type: 'Bearer'
        });
        nock('https://squidex.com')
            .get('/api/content/umbrela/zombies?$filter=id%20eq%20%27e53b749f-474b-4b84-bac0-93fea3584ec4%27')
            .reply(200, {
            "total": 1,
            "items": [
                {
                    "id": "e53b749f-474b-4b84-bac0-93fea3584ec4",
                    "createdBy": "client:fake:client",
                    "lastModifiedBy": "client:fake:client",
                    "data": {
                        "CNPJ": {
                            "iv": 30560848000136
                        },
                    },
                    "isPending": false,
                    "created": "2019-05-14T20:26:04Z",
                    "lastModified": "2019-05-14T20:26:04Z",
                    "status": "Published",
                    "version": 1
                }
            ]
        });
        const squidexImporter = new index_1.SquidexImporter({
            squidexId: fakeId,
            squidexSecret: fakeSecret,
            squidexAuthEndpoint: fakeAuthEndpoint,
            squidexApiBaseUrl: fakeSquidexApiBaseUrl
        });
        yield squidexImporter.connect();
        const result = yield squidexImporter.getByPk('umbrela', 'zombies', 'e53b749f-474b-4b84-bac0-93fea3584ec4');
        chai_1.expect(result._id).to.equal('e53b749f-474b-4b84-bac0-93fea3584ec4');
    })).timeout(5000);
    it('Orders the results', () => __awaiter(this, void 0, void 0, function* () {
        //TODO: Nock tests
    })).timeout(5000);
});
