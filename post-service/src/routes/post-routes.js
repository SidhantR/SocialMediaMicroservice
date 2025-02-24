const express = require('express')
const { createPost, getAllPost, getPost, deletePost}  = require('../controllers/post-controller')
const {authenticateRequest} = require('../middlewares/authMiddleware')

const router = express.Router()

//middleware
router.use(authenticateRequest)

router.post('/create-post', createPost)
router.get('/posts', getAllPost)
router.get('/:id', getPost)
router.delete('/:id', deletePost)

module.exports = router;