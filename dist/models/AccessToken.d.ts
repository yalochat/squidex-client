export declare class AccessToken {
    private access_token;
    private expires_in;
    private token_type;
    constructor(token: String, expiry: Number, type: String);
    readonly accessToken: String;
    readonly expiry: Number;
    readonly tokenType: String;
}
