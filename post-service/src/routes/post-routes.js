const express = require('express')
const { createPost, getAllPost, getPost}  = require('../controllers/post-controller')
const {authenticateRequest} = require('../middlewares/authMiddleware')

const router = express.Router()

//middleware
router.use(authenticateRequest)

router.post('/create-post', createPost)
router.get('/posts', getAllPost)
router.get('/:id', getPost)

module.exports = router;