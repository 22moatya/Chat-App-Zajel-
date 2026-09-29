const Room = require('../Models/roomModel');


// Create a new room
exports.createRoom = async (req, res) => {
    try{
      const { name, description, isPrivate } = req.body;
      if(!name?.trim()) {
          return res.status(400).json({message: 'Name is required'});
      }
      const room = await Room.create({
        name: name.trim(),
        description: description?.trim() || '',
        isPrivate: isPrivate === true,
        createdBy: req.user._id,
        members: isPrivate === true ? [req.user._id] : []
      });
      const roomData = await Room.findById(room._id)
      .populate('createdBy', 'name displayName')
      .lean();
      res.status(201).json({message: 'Room created successfully', room: roomData});
    } catch(error) {
        console.log('createRoom error:', error);
        res.status(500).json({message: 'Internal Server Error'});
    }
};

// Get all rooms
exports.getRooms = async (req, res) => {
    try{
     const rooms = await Room.find()
     .populate('createdBy', 'name displayName')
     .sort({createdAt: -1})
     .lean();
     res.status(200).json({message: 'Rooms fetched successfully', rooms});
    } catch(error) {
        console.log('getRooms error:', error);
        res.status(500).json({message: 'Internal Server Error'});
    }
}

// Get a room by ID
exports.getRoomById = async (req, res) => {
    try{
     const roomId = req.params.roomId;
     if(!roomId) {
         return res.status(400).json({message: 'Room ID is required'});
     }
     const room = await Room.findById(roomId)
     .populate('createdBy', 'name displayName')
     .lean();
     if(!room) {
         return res.status(404).json({message: 'Room not found'});
     }
     res.status(200).json({message: 'Room fetched successfully', room});
    } catch(error) {
        console.log('getRoomById error:', error);
        res.status(500).json({message: 'Internal Server Error'});
    }
}

// Update a room
exports.updatRoom = async (req, res) => {
    try{
     const roomId = req.params.roomId;
     if(!roomId) {
         return res.status(400).json({message: 'Room ID is required'});
     }
     const { name, description } = req.body;
     if(!name?.trim() && !description?.trim()) {
         return res.status(400).json({message: 'Provide at least name or description'});
     }
     const room = await Room.findById(roomId);
     if(!room) {
         return res.status(404).json({message: 'Room not found'});
     }
     // تحقق من الملكية
     if(room.createdBy.toString() !== req.user._id.toString()) {
         return res.status(403).json({message: 'Not authorized to update this room'});
     }
     if(name?.trim()) room.name = name.trim();
     if(description?.trim()) room.description = description.trim();
     await room.save();
     res.status(200).json({message: 'Room updated successfully', room});
    } catch(error) {
        console.log('updateRoom error:', error);
        res.status(500).json({message: 'Internal Server Error'});
    }
};

//
exports.deleteRoom = async (req, res) => {
    try{
     const roomId = req.params.roomId;
     if(!roomId) {
         return res.status(400).json({message: 'Room ID is required'});
     }
     const room = await Room.findById(roomId);
     if(!room) {
         return res.status(404).json({message: 'Room not found'});
     }
     if(room.createdBy.toString() !== req.user._id.toString()) {
         return res.status(403).json({message: 'Not authorized to delete this room'});
     }
     await Room.findByIdAndDelete(roomId);
     res.status(200).json({message: 'Room deleted successfully'});
    } catch(error) {
        console.log('deleteRoom error:', error);
        res.status(500).json({message: 'Internal Server Error'});
    }
};