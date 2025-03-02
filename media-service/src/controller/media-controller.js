const Media = require('../models/Media')
const { uploadMediaToCloudinary } = require('../utils/cloudinary')
const logger = require('../utils/logger')

module.exports = {
    uploadMedia: async (req,res) => {
        try{
            logger.info('Starting media upload')
            const { originalname, mimetype, buffer } = req.file
            const userId = req.user.userId;
            logger.info(`File details: name =${originalname}, type=${mimetype} `);
            logger.info('Uploading to cloudinary starting...');

            const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file)
            logger.info(`Cloudinary upload successfull , Public ID : ${cloudinaryUploadResult.public_id}`)
            const newlyCreatedMedia = new Media({
                publicId: cloudinaryUploadResult.public_id,
                originalName: originalname,
                mimeType: mimetype,
                url: cloudinaryUploadResult.secure_url,
                userId: userId
            })

            await newlyCreatedMedia.save()

            res.status(201).json({
                success: true,
                mediaId: newlyCreatedMedia._id,
                url: newlyCreatedMedia.url,
                message: 'Media Upload successfully'
            })
        }catch(err){
            logger.error('Error Upoading Media')
            return res.status(500).json({
                success: false,
                message: 'Error Upoading Media'
            })
        }
    },
    getAllMedia: async (req,res) => {
        try{
            const results = await Media.find()
            res.json(results)
        } catch(err){
            logger.error('Error fetching all media', err)
            res.status(500).json({
                success: false,
                message: 'Error fetching all media'
            })
        }
    }
}