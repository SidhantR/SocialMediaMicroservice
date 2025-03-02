const Post = require('../models/Post');
const logger = require('../utils/logger');
const { publishEvent } = require('../utils/rabbitmq');
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

            await publishEvent('post:created', {
                postId: newlyCreatedPost._id.toString(),
                userId: newlyCreatedPost.user.toString(),
                content: newlyCreatedPost.content,
                createdAt: newlyCreatedPost.createdAt
            })

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
    },
    getPost : async(req,res) => {
        logger.info('Get single post endoint hit...')
        try{
            const postId = req.params.id;
            const cacheKey = `post:${postId}`;
            const cachedPost = await req.redisClient.get(cacheKey)
            if(cachedPost){
                res.json(JSON.parse(cachedPost))
            }

            const singlePostDetailsById = await Post.findById(postId);
            if(!singlePostDetailsById){
                return res.status(404).json({
                    success: false,
                    message: 'Post not found'
                })
            }

            await req.redisClient.setex(cacheKey, 3600, JSON.stringify(singlePostDetailsById))
            res.json(singlePostDetailsById)
        }catch(err){
            logger.error('Error getting all posts', err)
            res.status(500).json({
                success: false,
                message: 'Error getting all posts'
            })
        }
    },
    deletePost: async(req,res) => {
        logger.info('Delete endpoint hit ...')
        try{
            const post = await Post.findByIdAndDelete({
                _id: req.params.id,
                user: req.user.userId
            })
            if(!post){
                return res.json({
                    success: false,
                    message: 'Post not found'
                })
            }
            // publish post delete method
            await publishEvent('post.deleted', {
                postId: post._id,
                userId: req.user.userId,
                mediaIds: post.mediaIds
            })

            // invalidate cache
            await invalidatePostCache(req, req.params.id)
            res.json({
                success: true,
                message: 'Post deleted successfully'
            })
        }catch(err){
            logger.warn('Error Deleting post')
            res.status(500).json({
                status: false,
                message: 'Error Deleting post'
            })
        }
    }
}

