const mongoose = require('mongoose')
const validator = require('validator')
const slugify = require('slugify')
const geoCoder = require('../utils/geocoder')

const jobSchema  = new mongoose.Schema({
    title:{
        type: String,
        required: [true, 'please enter Job title'],
        trim: true, //helps to remove the blank spaces
        maxlength: [100, 'job title cannot exceed 100 characters']
    },
    slug : String,
    description:{
        type: String,
        required: [true,'please enter the job description'],
        maxlength: [1000, 'job description can not exceed 1000 characters']
    },
    email: {
        type: String,
        validate: [validator.isEmail, 'please add a valid email address']
    },
    address:{
        type: String,
        required: [true, 'please add an address']
    },
    location:{
        type:{
            type: String,
            enum: ['Point']
        },
        coordinates : {
            type: [Number],
            index: '2dsphere'
        },
        formattedAddress: String,
        city: String,
        state: String,
        zipcode: String,
        country: String
    },
    company:{
        type:String,
        required: [true, 'please add the company name']
    },
    industry:{
        type: [String],
        required: [true, 'please enter industry for this job'],
        enum: {
            values: [
                'Business',
                'Information technology',
                'Banking',
                'Education/Training',
                'Telecommunication',
                'Others'
            ],
            message: 'please select the correct options for industry'
        }
    },
    jobType:{
        type: String,
        required: [true, 'please enter job type.'],
        enum:{
            values: [
                'Permanent',
                'Temporary',
                'Internship'
            ],
            message: 'please select correct option for the job type'
        }
    },
    minEducation:{
        type: String,
        required: [true, 'please enter the minimum education for this job'],
        enum:{
            values:[
                'Bachelors',
                'Masters',
                'Phd'
            ],
            message: 'please select correct options for '
        }
    },
    positions:{
        type: Number,
        default: 1
    },
    experience:{
        type: String,
        required: [true,'please enter the experience section required'],
        enum: {
            values: [
                'No experience',
                '1 Year - 2 Years',
                '2 Years - 5 Years',
                '5 Years+'
            ],
            message: 'Please select'
        }
    },
    salary:{
        type: Number,
        required: [true, 'Please enter expected the salary for this job']
    },
    postingDate:{
        type: Date,
        default: Date.now()
    },
    lastDate: {
        type: Date,
        default: new Date().setDate(new Date().getDate() + 7)
    },
    applicantsApplied:{
        type: [Object],
        select: false, //dosent send this feild while retreving the data
    },
    user:{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
        select: true
    }
});

//creating Job Slug before saving 
jobSchema.pre('save', function(next){
    //creating slug before saving to the DB
    this.slug = slugify(this.title,{lower: true});
    next();
})

//setting up Location 
jobSchema.pre('save', async function(next){
    const loc = await geoCoder.geocode(this.address)

    this.location = {
        type: 'Point',
        coordinates: [loc[0].longitude, loc[0].latitude],
        formattedAddress : loc[0].formattedAddress,
        city : loc[0].city,
        state: loc[0].stateCode,
        zipcode: loc[0].zipcode,
        country: loc[0].countryCode
    }
})

module.exports = mongoose.model('Job', jobSchema);