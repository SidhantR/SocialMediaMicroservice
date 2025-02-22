const Joi = require('joi')

module.exports = {
    validationRegistartion: (data) => {
        const schema = Joi.object({
            username: Joi.string().min(3).max(50).required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(6).required()
        })
    
        return schema.validate(data)
    },
    validationLogin: (data) => {
        const schema = Joi.object ({
            email: Joi.string().email().required(),
            password: Joi.string().min(6).required()
        })
        return schema.validate(data)
    }
}