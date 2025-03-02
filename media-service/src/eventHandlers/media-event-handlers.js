const { events } = require("../../../post-service/src/models/Post")
const Media = require("../models/Media")
const { deleteMediafromCloudniary } = require("../utils/cloudinary")

module.exports = {
    handlePostDeleted: async (event) => {
        const {postId, mediaIds} = event
        try{
            // retrieves all media files whose _id matches any in the mediaIds array.
            const mediaToDelete = await Media.find({_id: {$in : mediaIds}})
            
            for( const media of mediaToDelete){
                await deleteMediafromCloudniary(media.publicId)
                await Media.findByIdAndDelete(media._id)

                logger.info(`Deleted media ${media._id} associated with the deleted post ${postId}`)
            }
        }catch(err) {
            logger.error(err, 'Error occur while media deletion')
        }
    }
}