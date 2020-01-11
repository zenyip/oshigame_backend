const config = require('./utils/config')
const express = require('express')
const path = require('path')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const timeRouter = require('./controllers/time')
const cpkeysRouter = require('./controllers/cpkeys')
const usersRouter = require('./controllers/users')
const membersRouter = require('./controllers/members')
const loginRouter = require('./controllers/login')
const negotiationsRouter = require('./controllers/negotiations')
const jobRouter = require('./controllers/job')
const phraseRouter = require('./controllers/phrase')
const certBackgroundRouter = require('./controllers/certBackground')
const noticesRouter = require('./controllers/notices')
const resetRouter = require('./controllers/resetDB')
const mongoose = require('mongoose')
const logger = require('./utils/logger')
const middleware = require('./utils/middleware')

logger.info('connecting to', config.MONGODB_URI)

mongoose.connect(config.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
	.then(() => {
		logger.info('connected to MongoDB')
	})
	.catch((error) => {
		logger.error('error connection to MongoDB:', error.message)
	})

mongoose.set('useFindAndModify', false)

app.use(express.static('build'))
app.use(cors())
app.use(bodyParser.json())

app.use(middleware.tokenExtractor)

app.use('/api/time', timeRouter)
app.use('/api/cpkeys', cpkeysRouter)
app.use('/api/users', usersRouter)
app.use('/api/members', membersRouter)
app.use('/api/login', loginRouter)
app.use('/api/negotiations', negotiationsRouter)
app.use('/api/job', jobRouter)
app.use('/api/phrase', phraseRouter)
app.use('/api/certBackground', certBackgroundRouter)
app.use('/api/notices', noticesRouter)
app.use('/api/resetDB', resetRouter)

const catchAll = (request, response) => {
	response.sendFile(path.join(__dirname+'/build/index.html'))
}

app.get('/*', catchAll)

/*if (process.env.NODE_ENV === 'test') {
	const testingRouter = require('./controllers/testing')
	app.use('/api/testing', testingRouter)
}*/

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app