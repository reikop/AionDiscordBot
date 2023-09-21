import axios from "axios";
import crypto from 'crypto';
import https from 'https';

export default class MessageWorker {

    constructor() {
        this._api = axios.create({
            httpsAgent: new https.Agent({
                secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
            }),
            // baseURL : 'https://api-aion.plaync.com',
        });
    }

    receiveMessage(msg){}

    get api(){
        return this._api;
    }

}