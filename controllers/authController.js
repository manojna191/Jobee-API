const User = require('../models/users')
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const ErrorHandler = require('../utils/errorHandler');
const sendToken = require('../utils/jwtToken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

//register a new user => api/v1/register
exports.registerUser = catchAsyncErrors (async (req,res,next)=>{
    const {name,email,password,role} = req.body;

    const user = await User.create({
        name,
        email,
        password,
        role
    });

    //send the cookie to the user
    sendToken(user, 200, res)
})

// Login the user => api/v1/login
exports.loginUser = catchAsyncErrors(async (req,res,next)=>{
    const {email, password} = req.body;

    //checks if email or password is entered by user
    if(!email || !password){
        return next(new ErrorHandler('Please enter email & password', 400))
    }

    //finding user in database
    const user  = await User.findOne({email}).select('+password')

    if(!user){
        return next(new ErrorHandler('Invalid Email or Password', 401))
    }

    //check if password is correct or not
    const isPasswordMatched = await user.comparePassword(password)

    if(!isPasswordMatched){
        return next(new ErrorHandler('Invalid Email or Password', 401))
    }

    //send the cookie to the user
    sendToken(user, 200, res)
 
})

//Forgot Password => api/v1/password/forgot
exports.forgotPassword = catchAsyncErrors(async (req,res,next) => {
    const user = await User.findOne({email: req.body.email})

    if(!user){
        next(new ErrorHandler('No user found with this email',404))
    }

    //Get the reste token
    const resetToken = user.getResetPasswordToken();

    await user.save({validateBeforeSave: false})

    //create reset password url
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/password/reset/${resetToken}`

    const message = `your password reset link is as follow:\n\n${resetUrl}\n\nIf you have not requested this email, then ignore it.`

    try{
        await sendEmail({
            email: user.email,
            subject: 'Jobee Password Recovery',
            message
        })
    
        res.status(200).json({
            success: true,
            message: `Email sent to: ${user.email}`
        })
    }
    catch(error){
        user.resetPasswordExpire = undefined;
        user.resetPasswordToken = undefined;

        await user.save({validateBeforeSave: false})

        return next(new ErrorHandler(`Email is not sent`, 500))
    }
})

//Reset Password => api/v1/password/reset/:token
exports.resetPassword = catchAsyncErrors(async (req,res,next) => {
    //Hash url token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex')

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: {$gt: Date.now()}
    })

    if(!user){
        next(new ErrorHandler('Password Reset token is invalid.', 400))
    }

    //Setup new pasword
    user.password = req.body.password;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save()

    sendToken(user, 200, res)
})

//Logout user => api/v1/logout
exports.logout = catchAsyncErrors(async (req,res,next) => {
    res.cookie('token', 'none',{
        expires: new Date(Date.now()),
        httpOnly: true
    })

    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    })
})