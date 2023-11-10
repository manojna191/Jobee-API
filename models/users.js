const mongoose = require('mongoose');
const validator = require('validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

const userSchema = new mongoose.Schema({
    // schema fields go here
    name:{
        type: String,
        required: [true, 'please enter your name'],
    },
    email:{
        type: String,
        required: [true, 'please enter your email'],
        unique: true,
        validate: [validator.isEmail, 'please enter a valid email address']
    },
    role:{
        type: String,
        enum: {
            values: [
                'user',
                'employer'
            ],
            message: 'please select correct role'
        },
        default: 'user'
    },
    password:{
        type: String,
        required:[true, 'please enter your password for your account'],
        minLength: [8, 'your password must be at least 8 characters long'],
        select: false
    },
    createdAt:{
        type:  Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
},{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

userSchema.pre('save', async function(next){

    if(!this.isModified('password')){
        next()
    }

    this.password = await bcrypt.hash(this.password, 10)
})

//Return JSON Web token
userSchema.methods.getJwtToken = function(){
    return jwt.sign({id: this._id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_TIME
    })
}

//compare user password with the database password
userSchema.methods.comparePassword = async function(enterPassword){
    return await bcrypt.compare(enterPassword, this.password);
}

//Generate Password reset token
userSchema.methods.getResetPasswordToken = function(){
    //generate token
    const resetToken = crypto.randomBytes(20).toString('hex')

    //hash and set to resetpasswordToken
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    //set the token expire time
    this.resetPasswordExpire = Date.now() + 30 * 60 * 1000

    return resetToken
}

//show all jobs created by user using virtuals 
userSchema.virtual('jobsPublished',{
    ref: 'Job',
    localField: '_id',
    foreignField: 'user',
    justOne: false
})

module.exports = mongoose.model('User', userSchema);
