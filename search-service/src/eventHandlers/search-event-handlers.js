const Search = require("../model/Search")

module.exports = {
    handlePostCreate: async (event) => {
        try{
            const {postId, userId, createdAt, content} = event
            const newSearchPost = new Search({
                postId, 
                userId, 
                content,
                createdAt
            })
            await newSearchPost.save()
            logger.info(`Search post created: ${postId}, ${newSearchPost._id.toString()}`)
        } catch(err){
            logger.error('Error handling post creation event', err)
            res.status(500).json({
                success: false,
                message: 'Error handling post creation event'
            })
        }
    }
}