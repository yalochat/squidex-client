import { AccessToken } from './models/AccessToken';
export declare class SquidexImporter {
    private squidexId;
    private squidexSecret;
    private squidexAuthEndpoint;
    private squidexApiBaseUrl;
    private squidexAccessToken;
    private autoPublish;
    private autoPaginate;
    constructor(options: any);
    connect(): Promise<AccessToken>;
    search(schema: String, content: String, field: String, equals: any, order?: String, direction?: String): Promise<any[]>;
    query(schema: String, content: String, query: any): Promise<any[]>;
    getByPk(schema: String, content: String, pk: String): Promise<any>;
    get(schema: String, content: String, order?: String, direction?: String): Promise<any[]>;
    insert(schema: string, content: string, data: object): Promise<any>;
    update(schema: String, content: String, recordId: Number, data: Object): Promise<void>;
    delete(schema: String, content: String, recordId: Number): Promise<void>;
    setAutoPublish(autoPublish: Boolean): void;
    setAutoPaginate(autoPaginate: Boolean): void;
    private getOnCriteria;
    private searchOnCriteria;
    private agregateResults;
    private prepareInsertArguments;
    private getAccessToken;
    private getRequestOptions;
}
