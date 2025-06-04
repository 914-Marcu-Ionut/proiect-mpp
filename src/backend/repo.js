const utils = require('./utils')
const entity_validator = require('./validator')

class Repo{

    constructor(validator){
        this.validator = validator
        this.data = []
    }

    getData() {
        return utils.build_status_obj(1,this.data)
    }

    insert(entity){
        let status = this.validator.validate(entity)
        if(status['status'] == 1){
            this.data.push(entity)
        }
        return status
    }

    replace(entity,new_entity){
        let to_find_hash = utils.hash_json(entity)

        let found_idx = -1
        for(let i=0;i<this.data.length;i++){
            let hash = utils.hash_json(this.data[i])
            if(hash == to_find_hash){
                found_idx = i
                break
            }
        }

        if(found_idx == -1){
            return utils.build_status_obj(-1,"entity not found")
        }

        this.data[found_idx] = new_entity
        return utils.build_status_obj(1)
    }

    delete(entity){

        let to_find_hash = utils.hash_json(entity)

        let found_idx = -1
        for(let i=0;i<this.data.length;i++){
            let hash = utils.hash_json(this.data[i])
            if(hash == to_find_hash){
                found_idx = i
                break
            }
        }

        if(found_idx == -1){
            return utils.build_status_obj(-1,"entity not found")
        }

        this.data.splice(found_idx,1)
        return utils.build_status_obj(1)
    }


    sort(order='desc'){

        if(order == undefined){
            order = 'desc'
        }

        if(order != 'desc' && order != 'asc'){
            return utils.build_status_obj(-1,"unknown sort method")
        }

        let compare = (a,b)=>{
            if(order == 'desc'){
                return a > b
            } else {
                return a < b
            }
        }

        let new_data = this.data.map(item => utils.deepCopy(item));

        for(let i=0;i<this.data.length;i++){
            for(let j=i+1;j<this.data.length;j++){
                if(compare(new_data[j].data.percent,new_data[i].data.percent)){
                    let temp = new_data[i]
                    new_data[i] = new_data[j]
                    new_data[j] = temp
                }
            }
        }

        return utils.build_status_obj(1,new_data)
    }

    filter(percent){
        if(!percent || percent == NaN || typeof(percent) != 'number'){
            return utils.build_status_obj(-1,"invalid percent")
        }

        let new_data = []

        for(let i=0;i<this.data.length;i++){
            if(this.data[i].data.percent >= percent){
                new_data.push(this.data[i])
            }
        }

        return utils.build_status_obj(1,new_data)
    }

}

class FullRepo {
    constructor(default_repo,ai_repo){
        this.default_repo = default_repo
        this.ai_repo = ai_repo
    }

    /**
   * Gets a repository by name
   * @param {string} name - The name of the repository to get
   * @returns {Repo|null} The repository or null if not found
   */
    get(name){
        if(name == "ai"){
            return this.ai_repo
        } else if(name == "default"){
            return this.default_repo
        } else {
            return null
        }
    }
}

//module.exports = new FullRepo(new Repo(new entity_validator()),new Repo(new entity_validator()))

module.exports = {
    Repo,
    FullRepo,
    default: new FullRepo(new Repo(new entity_validator()), new Repo(new entity_validator()))
  };