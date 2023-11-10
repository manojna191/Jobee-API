//Create and send Token and save in cookie 
const sendToken = (user, statusCode, res, req)=>{
    //create JWT token
    const token = user.getJwtToken();

    // Options for cookie
    const Options = {
        expires: new Date(Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000),
        httpOnly: true
    }

    if(process.env.NODE_ENV === 'production'){
        Options.secure = true
    }

    res.status(statusCode)
    .cookie('token', token, Options)
    .json({
        success: true,
        token
    })
}

module.exports = sendToken