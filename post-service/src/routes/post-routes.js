const express = require('express')
const { createPost}  = require('../controllers/post-controller')
const {authenticateRequest} = require('../middlewares/authMiddleware')

const router = express.Router()

//middleware
router.use(authenticateRequest)

router.post('/create-post', createPost)

module.exports = router;