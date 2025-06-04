const crypto = require('crypto');

class Utils{
    constructor(){

    }

    hash_json(data){
        return this.hash_data(JSON.stringify(data))
    }

    hash_data(data){
        const hash = crypto.createHash('sha256');
        hash.update(data);
        return hash.digest('hex');
    }

    deepCopy(obj) {
        return JSON.parse(JSON.stringify(obj));
    };

    build_status_obj(status,data=null){
        if(data != null){
            return {
                'status':status,
                'data':data
            }
        } else {
            return {
                'status':status
            }
        }
    }
}

module.exports = new Utils()