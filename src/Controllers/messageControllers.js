const Message = require('../Models/messageModel');

exports.getMessages = async (req, res) => {
    try{
        const roomId = req.params.roomId;
        // لحساب عدد الرسائل التى يتم عرضها
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        // لحساب مكان الرسائل التى يتم عرضها
        const skip = parseInt(req.query.skip) || 0;
        if(!roomId) {
            return res.status(400).json({message: 'Room ID is required'});
        };
        const messages = await Message.find({room: roomId})
        .sort({createdAt: -1})
        .skip(skip)
        .limit(limit)
        .populate('sender', 'name displayName')
        .lean();
        res.status(200).json({message: 'Messages fetched successfully', messages});
    } catch(error) {
        console.log('getMessages error:', error);
        res.status(500).json({message: 'Internal Server Error'});
    }
};