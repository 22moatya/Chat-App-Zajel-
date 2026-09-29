const express = require('express');
const messageControllers = require('../Controllers/messageControllers');
const router = express.Router();
const auth = require('../Middlewares/auth');


router.get('/:roomId', auth, messageControllers.getMessages);
// router.post('/', auth, messageControllers.createMessage);

module.exports = router;