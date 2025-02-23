const logger = require('../utils/logger')

module.exports = {
    authenticateRequest : async(req,res,next) => {
        const userId = req.headers['x-user-id'];
        if(!userId){
            logger.warn('Access attempted without user ID')
            res.status(401).json({
                status: false,
                message: 'Authentication required! Please login to continue'
            })
        }
        req.user ={userId}
        next()
    }
}