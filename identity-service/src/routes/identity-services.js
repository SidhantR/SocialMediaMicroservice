const express = require('express')
const router = express.Router()

const { registerUser, loginUser, logoutUser, refreshTokenUser } = require('../controllers/identity-controller')

router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/refresh-token', refreshTokenUser)
router.post('/logout', logoutUser)

module.exports = router