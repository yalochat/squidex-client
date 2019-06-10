"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AccessToken {
    constructor(token, expiry, type) {
        this.access_token = token;
        this.expires_in = expiry;
        this.token_type = type;
    }
    get accessToken() {
        return this.access_token;
    }
    get expiry() {
        return this.expires_in;
    }
    get tokenType() {
        return this.token_type;
    }
}
exports.AccessToken = AccessToken;
