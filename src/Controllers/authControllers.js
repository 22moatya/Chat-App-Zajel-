const User = require('../Models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


exports.registerUser = async (req, res) => {
    try {
        const {name, email, password} = req.body;
        if(!name || !email || !password) {
            return res.status(400).json({message: 'All fields are required'});
        };
        if(password.length < 6) {
            return res.status(400).json({message: 'Password must be at least 6 characters'});
        };
        const existingUser = await User.findOne({
            $or: [
                {email: email.trim().toLowerCase()},
                {name: name.trim()}
            ]
        });

        if(existingUser) {
            return res.status(400).json({message: 'User already exists'});
        }
        const hashPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: hashPassword
        });
        // remove password لعدم عرض الباسورد في الرسالة
        const userObj = user.toObject();
        delete userObj.password;
        res.status(201).json({message: 'User created successfully', user: userObj});

    } catch (error) {
        console.log('registerUser error:', error);
        res.status(500).json({message:'Internal Server Error'});
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if(!email || !password) {
            return res.status(400).json({message: 'All fields are required'});
        };
        const user = await User.findOne({email: email.trim().toLowerCase()});
        if(!user){
            return res.status(400).json({message: 'User does not exist'});
        };
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({message: 'Invalid credentials'});
        };
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '7d'});
        const userObj = user.toObject();
        delete userObj.password;
        res.status(200).json({message: 'Login successful', user: userObj, token});
    } catch (error) {
        console.log('loginUser error:', error);
        res.status(500).json({message:'Internal Server Error'});
    }
}