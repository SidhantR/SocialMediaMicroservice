const RefreshToken = require('../models/RefreshToken')
const User = require('../models/User')
const generateToken = require('../utils/generateToken')
const logger = require('../utils/logger')
const {validationRegistartion, validationLogin} = require('../utils/validation')

module.exports = {
    //user registration
    registerUser : async (req,res) => {
        logger.info('Registration endpoint hit...')
        try {
            //validate the schema
            const {error} = validationRegistartion(req.body)
            if(error){
                logger.warn('Validation error', error.details[0].message)
                return res.status(400).json({
                    success: false,
                    message: error.details[0].message
                })
            }
            const {email, password, username} = req.body
            
            let user = await User.findOne({$or: [{email}, {username}]})
            if(user){
                logger.warn('User already exists')
                return res.status(400).json({
                    success: false,
                    message: 'User already exists'
                })
            }
            user = new User({username, email, password})
            await user.save()
            logger.warn('User saved successfully', user._id )

            const {refreshToken, accessToken} = await generateToken(user)

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                accessToken,
                refreshToken
            })
        } catch(e) {
            logger.error('Registration error occured', e)
            res.status(500).json({
                success: false,
                message: 'Internal Server Error'
            })
        }
    },

    //user login
    loginUser: async (req,res) => {
        logger.info('Login endpoint hit...')
        try{
            const {error} = validationLogin(req.body)
            if(error){
                logger.warn('Validation error', error.details[0].message)
                res.status(400).json({
                    success: false,
                    message: error.details[0].message
                })
            }
            const {email, password} = req.body
            console.log(email, password, 'email, password');
            
            const user = await User.findOne({email})
            if(!user){
                logger.warn('Invalid User')
                res.status(400).json({
                    success: false,
                    message: 'Invalid Credentials'
                })
            }

            const isValidPassword = await user.comparePassword(password)
            if(!isValidPassword){
                logger.warn('Invalid Password')
                res.status(400).json({
                    success: false,
                    message: 'Invalid Credentials'
                }) 
            }
            const {accessToken, refreshToken} = await generateToken(user)
            res.json({
                accessToken,
                refreshToken,
                userId: user._id
            })
        }catch(err){
            logger.error('Login error occured', err)
            res.status(500).json({
                success: false,
                message: "Internal Server error"
            })
        }
    },
    //refresh token
    refreshTokenUser: async (req,res) => {
        logger.info('Refresh Token hit..')
        try{
            const {refreshToken} = req.body;
            if(!refreshToken){
                logger.warn('Refresh Token missing')
                res.status(400).json({
                    status: false,
                    message: 'Refresh Token missing'
                })
            }
            const storedToken = await RefreshToken.findOne({token: refreshToken})
            if(!storedToken || storedToken.expiresAt < new Date()){
                logger.warn('Invalid or expired refresh token')
                return res.status(401).json({
                    success: false,
                    message: 'Invalid or expired refresh token'
                })
            }
            const user = await User.findById(storedToken.user)
            if(!user){
                logger.warn('User not found')
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                })
            }
            const {accessToken: newAccessToken, refreshToken: newRefreshToken} = 
            await generateToken(user)

            //delete the old refresh token
            await RefreshToken.deleteOne({_id: storedToken._id})

            res.json({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            })
        }catch(err){
            logger.error('Refresh token error occured')
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            })
        }
    },
    // logout
    logoutUser: async(req,res) => {
        logger.info('Log out endpoint Hit..')
        try {
            const {refreshToken} = req.body
            if(!refreshToken){
                logger.warn('Refresh Token misisng')
                res.status(400).json({
                    success: false,
                    message: "Refresh Token misisng"
                })
            }
            await RefreshToken.deleteOne({token: refreshToken})
            logger.info('Refresh Token deleted')
            res.json({
                success: true,
                message: 'Logout successfully'
            })
        } catch (err) {
            logger.error('Error while logging out', err)
            res.status(500).json({
                success: false,
                message: "Internal Server error"
            })
        }
    }
}