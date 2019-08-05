'use strict'
import * as request from 'request-promise'
import { AccessToken } from './models/AccessToken'

export class SquidexImporter {
    // input parameters in constructor
    private squidexId: string
    private squidexSecret: string
    private squidexAuthEndpoint: string
    private squidexApiBaseUrl: string

    // interanl paramteres
    private squidexAccessToken: AccessToken
    private autoPublish: Boolean
    private autoPaginate: Boolean

    constructor(options: any) {
        this.squidexId = options.squidexId
        this.squidexSecret = options.squidexSecret
        this.squidexAuthEndpoint = options.squidexAuthEndpoint
        this.squidexApiBaseUrl = options.squidexApiBaseUrl
        this.autoPublish = false
        this.autoPaginate = false
    }

    public async connect() {
        this.squidexAccessToken = await this.getAccessToken()
        return this.squidexAccessToken
    }

    public async search(schema: String, content: String, field: String, equals: any, order?: String, direction?: String) {
        let criteria = (isNaN(equals)) ? `?$filter=data/${field}/iv eq '${equals}'` : `?$filter=data/${field}/iv eq ${equals}`
        if(order && direction) {
          criteria = (isNaN(equals)) ? `?$filter=data/${field}/iv eq '${equals}'` : `?$filter=data/${field}/iv eq ${equals}&$orderby='data/${order}/iv ${direction}'`
        }
        return this.searchOnCriteria(schema, content, field, equals, criteria)
    }

    public async query(schema: String, content: String, query: any) {
      let criteria = '?$filter='

      const queryKeys = Object.keys(query)
      queryKeys.forEach(key => {
        if (isNaN(query[key])) {
            criteria += `data/${key}/iv eq '${query[key]}' and `
        } else {
          criteria += `data/${key}/iv eq ${query[key]} and `
        }
      })

      criteria = criteria.trim()
      criteria = criteria.slice(0, -4)
      return this.getOnCriteria(schema, content, criteria)
    }

    public async getByPk(schema: String, content: String, pk: String) {
        const criteria = `?$filter=id eq '${pk}'`
        const url = `${this.squidexApiBaseUrl}/${schema}/${content}${criteria}`
        const options = this.getRequestOptions('GET', url, {}, this.squidexAccessToken.accessToken)

        const preResult = await request(options)
            .catch((error: any) => {
                console.log(`Error while searching record ${JSON.stringify(pk)} from schema: ${schema} and content: ${content}`)
                console.log(error.error)
                return null
            })

        const result = []
        preResult.items.forEach(item => {
            const data = item.data
            const id = item.id
            const dataKeys = Object.keys(data)
            const transformedItem = {
                _id: id
            }
            dataKeys.forEach(key => {
                transformedItem[key] = data[key].iv
            })
            result.push(transformedItem)
        })

        if (result.length > 0) {
            return result[0]
        } else {
          return -1
        }

    }

    public async get(schema: String, content: String, order?: String, direction?: String) {
      const criteria = `?$orderby=data/${order}/iv ${direction}`
      if(order && direction) {
          return this.getOnCriteria(schema, content, criteria)
      }
      return this.getOnCriteria(schema, content, '')
    }

    public async insert(schema: string, content: string, data: object) {
        const insertQuery = this.prepareInsertArguments(data)
        const publishParam = (this.autoPublish) ? '?publish=true': ''
        const url = `${this.squidexApiBaseUrl}/${schema}/${content}${publishParam}`
        const options = this.getRequestOptions('POST', url, insertQuery, this.squidexAccessToken.accessToken)

        return request(options)
            .catch((error: any) => {
                console.log(`Error while inserting record ${JSON.stringify(data)} from schema: ${schema} and content: ${content}`)
                console.log(error.error)
                return null
            })
    }

    public async update(schema: String, content: String, recordId: Number, data: Object) {
        const updateQuery = this.prepareInsertArguments(data)
        const url = `${this.squidexApiBaseUrl}/${schema}/${content}/${recordId}`
        const options = this.getRequestOptions('PUT', url, updateQuery, this.squidexAccessToken.accessToken)

        request(options)
            .catch((error: any) => {
                console.log(`Error while updating record ${JSON.stringify(data)} from schema: ${schema} and content: ${content}`)
                console.log(error.error)
                return null
            })
    }

    public async delete(schema:String, content: String, recordId: Number) {
        const url = `${this.squidexApiBaseUrl}/${schema}/${content}/${recordId}`
        const options = this.getRequestOptions('DELETE', url, {}, this.squidexAccessToken.accessToken)

        request(options)
            .catch((error: any) => {
                console.log(`Error while deleting record ${recordId} from schema: ${schema} and content: ${content}`)
                console.log(error)
                return null
            })
    }

    public setAutoPublish(autoPublish: Boolean) {
        this.autoPublish = autoPublish
    }

    public setAutoPaginate(autoPaginate: Boolean) {
      this.autoPaginate = autoPaginate
    }

    private async getOnCriteria(schema: String, content: String, criteria: String) {
      let url = `${this.squidexApiBaseUrl}/${schema}/${content}${criteria}`
      let options = this.getRequestOptions('GET', url, {}, this.squidexAccessToken.accessToken)

      let preResult = await request(options)
          .catch((error: any) => {
              console.log(`Error while getting records from schema: ${schema} and content: ${content}`)
              console.log(error.error)
              return null
          })

      const result = []
      this.agregateResults(preResult, result)
      // the pagination
      if(this.autoPaginate) {
        if (preResult.total >= 200) {
          const totalPages = Math.ceil((preResult.total / 200))

          for (let i = 1; i < totalPages; i++ ) {
            const skip = (i*200)
            if(criteria) {
                url = `${url}&$top=200&$skip=${skip}`
            } else {
                url = `${url}?$top=200&$skip=${skip}`
            }

            options = this.getRequestOptions('GET', url, {}, this.squidexAccessToken.accessToken)
            preResult = await request(options)
                .catch((error: any) => {
                    console.log(`Error while getting records from schema: ${schema} and content: ${content} on page: ${i}`)
                    console.log(error.error)
                    return null
                })
            this.agregateResults(preResult, result)
          }
        }
      }

      return result
    }

    private async searchOnCriteria(schema: String, content: String, field: String, equals: any, criteria: String) {
      let originalUrl = `${this.squidexApiBaseUrl}/${schema}/${content}${criteria}`
      let options = this.getRequestOptions('GET', originalUrl, {}, this.squidexAccessToken.accessToken)

      let preResult = await request(options)
          .catch((error: any) => {
              console.log(`Error while searching record ${JSON.stringify(equals)} from schema: ${schema} and content: ${content}`)
              console.log(error.error)
              return null
          })

      const result = []
      this.agregateResults(preResult, result)

      // the pagination
      if(this.autoPaginate) {
        if (preResult.total >= 200) {
          const totalPages = Math.ceil((preResult.total / 200))
          for (let i = 1; i < totalPages; i++ ) {
            const skip = (i*200)
            let url
            if(criteria) {
                let url = `${originalUrl}&$top=200&$skip=${skip}`
            } else {
                let url = `${originalUrl}?$top=200&$skip=${skip}`
            }
            options = this.getRequestOptions('GET', url, {}, this.squidexAccessToken.accessToken)
            preResult = await request(options)
                .catch((error: any) => {
                    console.log(`Error while searching record ${JSON.stringify(equals)} from schema: ${schema} and content: ${content} on page: ${i}`)
                    console.log(error.error)
                    return null
                })
            this.agregateResults(preResult, result)
          }
        }
      }

      return result
    }

    private agregateResults(preResult: any, result: any) {
      preResult.items.forEach(item => {
          const data = item.data
          const id = item.id
          const dataKeys = Object.keys(data)
          const transformedItem = {
              _id: id
          }
          dataKeys.forEach(key => {
              transformedItem[key] = data[key].iv
          })
          result.push(transformedItem)
      })
    }

    private prepareInsertArguments(criteria: Object) {
        const keys = Object.keys(criteria)
        const query = {}
        keys.map(key => {
            query[key] = {
                'iv': criteria[key]
            }
        })
        return query
    }

    private async getAccessToken() {
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
        }

        const response = await request(options)
            .catch((error: any) => {
                console.log('Error while getting cms access token')
                console.log(error)
                return null
            })

        return new AccessToken(response.access_token, response.expires_in, response.token_type)
    }

    private getRequestOptions(method: String, url: String, body: Object, accessToken: String) {
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
        }
    }
}
