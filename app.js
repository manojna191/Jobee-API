const express = require('express')
const app = express();

const dotenv = require('dotenv')
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload') // parse file uploads
const rateLimit = require('express-rate-limit')
const helmet = require('helmet') // set security headers
const mongoSanitize = require('express-mongo-sanitize') // sanitize data
const xssClean = require('xss-clean')

// Parameter pollution refers to a situation in web development 
//where multiple parameters of the same name exist in a query string of a URL or 
//In a request body. This can lead to unpredictable behavior, errors, or security vulnerabilities in an application.
const hpp = require('hpp')
const cors = require('cors')
const bodyParser = require('body-parser')

const connectDatabase = require('./config/database')
const errorMiddleware = require('./middlewares/errors')
const ErrorHandler = require('./utils/errorHandler')

//setting up config.env file variables
dotenv.config({path: './config/config.env'})

//Handling uncaught exception 
process.on('uncaughtException', err =>{
    console.log(`Error: ${err.message}`);
    console.log('Shutting down due to uncaught exception');
    process.exit(1)
})

//connecting to database
connectDatabase();

//set up body parser
app.use(bodyParser.urlencoded({extended: true}))

app.use(express.static('public'))

//setup security headers
app.use(helmet())

//setup bodyparser
app.use(express.json())

//set cookie parser
app.use(cookieParser())

//Handle file uploads
app.use(fileUpload())

//sanitize data
app.use(mongoSanitize())

//prevent xss attacks
app.use(xssClean())

//prevent parameter pollution
app.use(hpp({
    whitelist: ['positions']
}))

//Rate Limiting =>  10mins 100 requests
const limiter = rateLimit({
    windowMs: 10*60*1000, //10 minutes
    max: 100
})

//setup cors - accessible by other domains
app.use(cors())

app.use(limiter)

//importing all routes
const jobs = require('./routes/jobs')
const auth = require('./routes/auth')
const user = require('./routes/user')

app.use('/api/v1',jobs)
app.use('/api/v1',auth)
app.use('/api/v1',user)

//Handle unhandled routes
app.all('*', (req,res,next)=>{
    next(new ErrorHandler(`${req.originalUrl} route not found`, 404))
})

//Middleware to handle errors
app.use(errorMiddleware)

const PORT = process.env.PORT;
const server = app.listen(PORT, ()=>{
    console.log(`server started on ${PORT}`);
})

//Handling unhandled server errors
process.on('unhandledRejection',(err)=>{
    console.log(`Error: ${err.message}`)
    console.log('Shutting down the server due to Unhandled promise rejection')

    server.close(()=>{
        process.exit(1)
    })
})

