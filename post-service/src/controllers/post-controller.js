const Post = require('../models/Post');
const logger = require('../utils/logger');
const { validateCreatePost } = require('../utils/validation');

module.exports = {
    createPost : async(req,res,) => {
        logger.info('Create post endoint hit...')
        try{
            const {error} = validateCreatePost(req.body)
            if(error){
                logger.warn('Validation error', error.details[0].message)
                res.status(400).json({
                    success: false,
                    message: error.details[0].message
                })
            }
            const {content, mediaIds} = req.body;
            const newlyCreatedPost = new Post({
                user: req.user.userId,
                content,
                mediaIds: mediaIds || []
            })
            console.log(newlyCreatedPost,'newlyCreatedPost');
            
            await newlyCreatedPost.save()
            logger.info('Post created succesfully')
            res.status(201).json({
                status: true,
                messgae: 'Post created succesfully'
            })
        }catch(err){
            logger.error('Error creating post', err)
            res.status(500).json({
                success: false,
                message: 'Error Creating post'
            })
        }
    }
}

