const jwt = require('jsonwebtoken');
const User = require('../Models/userModel');


const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith('Bearer')) {
            return res.status(401).json({message: 'Unauthorized'});
        };
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if(!user) {
            return res.status(401).json({message: 'Unauthorized'});
        };
        req.user = user;
        next();
    } catch (error) {
        console.log('auth error:', error);
        res.status(500).json({message: 'Internal Server Error'});
    }
};

module.exports = auth;