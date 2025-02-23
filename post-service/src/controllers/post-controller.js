const Post = require('../models/Post');
const logger = require('../utils/logger');
const { invalidatePostCache } = require('../utils/utility');
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
            await newlyCreatedPost.save()

            // deleting cache while new post is added
            await invalidatePostCache(req, newlyCreatedPost._id.toString())

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
    },
    getAllPost : async(req,res) => {
        logger.info('Get all posts endoint hit...')
        try{
            const page = req.query.page || 1;
            const limit = req.query.limit || 10;
            const startIndex = (page -1) * 10

            const cacheKey = `posts:${page}:${limit}`

            // fetching from cache - if present returning it
            const cachedPosts = await req.redisClient.get(cacheKey);
            if(cachedPosts){
                res.json(JSON.parse(cachedPosts))
            }

            const posts = await Post.find({}).sort({createdAt: -1}).skip(startIndex).limit(limit)
            const totalNoOfPost = await Post.countDocuments()

            const result = {
                posts,
                currentPage: page,
                totalPages: Math.ceil(totalNoOfPost/limit),
                totalPost: totalNoOfPost
            }

            // save posts in redis cache - 5min
            await req.redisClient.setex(cacheKey, 300, JSON.stringify(result))

            res.json(result)
        }catch(err){
            logger.error('Error getting all posts', err)
            res.status(500).json({
                success: false,
                message: 'Error getting all posts'
            })
        }
    }
}

