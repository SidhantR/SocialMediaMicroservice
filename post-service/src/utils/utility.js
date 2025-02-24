module.exports = {
    invalidatePostCache: async(req,input) => {
        const cacheKey = `post:${input}`
        await req.redisClient.del(cacheKey)

        const keys = await req.redisClient.keys('post:*')
        if(keys.length > 0){
            await req.redisClient.del(keys)
        }
    }
}