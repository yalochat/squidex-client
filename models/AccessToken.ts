export class AccessToken {
    private access_token: String
    private expires_in: Number
    private token_type: String

    constructor(token: String, expiry: Number, type: String) {
        this.access_token = token
        this.expires_in = expiry
        this.token_type = type
    }

    public get accessToken(): String {
        return this.access_token
    }

    public get expiry(): Number {
        return this.expires_in
    }

    public get tokenType(): String {
        return this.token_type
    }
}