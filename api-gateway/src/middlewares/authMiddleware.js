const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

module.exports ={
    validateToken: async(req,res, next) => {
        console.log(req.headers, 'req.headers')
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if(!token){
            logger.warn('Acess without valid token');
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            })
        }

        jwt.verify(token, process.env.JWT_SECRET, (err,user) => {
            console.log(user, 'user', err)
            if(err){
                logger.warn('Invalid token')
                res.status(429).json({
                    success: false,
                    message: 'Invalid token'
                })
            }
            req.user = user;
            next()
        })
    }
}