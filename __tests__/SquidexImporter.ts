import { SquidexImporter } from '../index'
import * as nock from 'nock'
import { expect } from 'chai'
import 'mocha'

const fakeId = 'app:content'
const fakeSecret = 'secret-key'
const fakeAuthEndpoint = 'https://squidex.com/identity-server/connect/token'
const fakeSquidexApiBaseUrl = 'https://squidex.com/api/content'

describe('Test importer', () => {
    it('Constructor should not return null', async () => {
        const squidexImporter = new SquidexImporter({
            squidexId: fakeId,
            squidexSecret: fakeSecret,
            squidexAuthEndpoint: fakeAuthEndpoint,
            squidexApiBaseUrl: fakeSquidexApiBaseUrl
        })
        expect(squidexImporter).to.not.equal(null)
    })

    it('Connect returns an access token', async () => {
        nock('https://squidex.com')
            .post('/identity-server/connect/token')
            .reply(200, {
                access_token: 'some-access-token',
                expores_in: 2592000,
                token_type: 'Bearer'
            })


        const squidexImporter = new SquidexImporter({
            squidexId: fakeId,
            squidexSecret: fakeSecret,
            squidexAuthEndpoint: fakeAuthEndpoint,
            squidexApiBaseUrl: fakeSquidexApiBaseUrl
        })
        const accessToken  = await squidexImporter.connect()
        expect(accessToken.accessToken).to.equal('some-access-token')
    })

    it('Can search content from squidex', async () => {
        nock('https://squidex.com')
            .post('/identity-server/connect/token')
            .reply(200, {
                access_token: 'some-access-token',
                expores_in: 2592000,
                token_type: 'Bearer'
            })

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
            })

        const squidexConnection = {
            squidexId: fakeId,
            squidexSecret: fakeSecret,
            squidexAuthEndpoint: fakeAuthEndpoint,
            squidexApiBaseUrl: fakeSquidexApiBaseUrl
        }

        const importer = new SquidexImporter(squidexConnection)
        await importer.connect()
        const result = await importer.search('some', 'clients', 'CNPJ', '30560848000136')

        expect(result[0].CNPJ).to.equal(30560848000136)
    })

    it('Can get all content from squidex', async () => {
        nock('https://squidex.com')
            .post('/identity-server/connect/token')
            .reply(200, {
                access_token: 'some-access-token',
                expores_in: 2592000,
                token_type: 'Bearer'
            })

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
            })

        const squidexConnection = {
            squidexId: fakeId,
            squidexSecret: fakeSecret,
            squidexAuthEndpoint: fakeAuthEndpoint,
            squidexApiBaseUrl: fakeSquidexApiBaseUrl
        }

        const importer = new SquidexImporter(squidexConnection)
        await importer.connect()
        const result = await importer.get('some', 'clients')

        expect(result[0].CNPJ).to.equal(30560848000136)
    })

    it('Inserts a record and autopublish it', async() => {
        nock('https://squidex.com')
            .post('/identity-server/connect/token')
            .reply(200, {
                access_token: 'some-access-token',
                expores_in: 2592000,
                token_type: 'Bearer'
            })

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
            })

        const squidexImporter = new SquidexImporter({
                squidexId: fakeId,
                squidexSecret: fakeSecret,
                squidexAuthEndpoint: fakeAuthEndpoint,
                squidexApiBaseUrl: fakeSquidexApiBaseUrl
            })
        await squidexImporter.connect()
        squidexImporter.setAutoPublish(true)
        const insertResult = await squidexImporter.insert('umbrela', 'zombies', {
            name: 'Tyrant',
            type: 'Mutant'
        })
        expect(insertResult.id).to.equal(123456)
    })

    it('Can search by primary key', async() => {
      // TODO: add nock test
      nock('https://squidex.com')
          .post('/identity-server/connect/token')
          .reply(200, {
              access_token: 'some-access-token',
              expores_in: 2592000,
              token_type: 'Bearer'
          })
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
          })
      const squidexImporter = new SquidexImporter({
                  squidexId: fakeId,
                  squidexSecret: fakeSecret,
                  squidexAuthEndpoint: fakeAuthEndpoint,
                  squidexApiBaseUrl: fakeSquidexApiBaseUrl
                })
      await squidexImporter.connect()
      const result = await squidexImporter.getByPk('umbrela', 'zombies', 'e53b749f-474b-4b84-bac0-93fea3584ec4')
      expect(result._id).to.equal('e53b749f-474b-4b84-bac0-93fea3584ec4')
    }).timeout(5000)

    it('Orders the results', async () => {
      //TODO: Nock tests
      const importer = new SquidexImporter({
                  squidexId: fakeId,
                  squidexSecret: fakeSecret,
                  squidexAuthEndpoint: fakeAuthEndpoint,
                  squidexApiBaseUrl: fakeSquidexApiBaseUrl
                })
      await importer.connect()
      const results = await importer.get('store', 'products', 'position', 'asc')
      console.log(results)
    }).timeout(5000)
})
