import _ from "lodash";
import axios from "axios";

class ServerService {
    constructor() {
        this.servers = [];
    }

    async init() {
        const response = await axios.get(`https://reikop.io/api/servers`);
        this.servers = response.data.filter(n => n.world === 'CLASSIC');
    }

    findServerByName(serverName) {
        return _.find(this.servers, { serverName });
    }

    getServerList() {
        return this.servers;
    }

    findServerById(serverId) {
        return _.find(this.servers, { serverId });
    }
}

export default new ServerService();