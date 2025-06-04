const utils = require('./utils')

class Validator {
    constructor() {
    }

    validate(entity) {
        if(entity.data.percent == undefined || typeof(entity.data.percent) != 'number'){
            return utils.build_status_obj(-1,"invalid entity, percent is not number")
        }
        return utils.build_status_obj(1)
    }
}

module.exports = Validator