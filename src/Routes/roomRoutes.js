const express = require('express');
const router = express.Router();
const roomControllers = require('../Controllers/roomControllers');
const auth = require('../Middlewares/auth');

router.get('/', auth, roomControllers.getRooms);
router.post('/', auth, roomControllers.createRoom);
router.get('/:roomId', auth, roomControllers.getRoomById);
router.put('/:roomId', auth, roomControllers.updatRoom);
router.delete('/:roomId', auth, roomControllers.deleteRoom);

module.exports = router;