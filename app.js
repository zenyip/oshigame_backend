const config = require('./utils/config')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const cpkeysRouter = require('./controllers/cpkeys')
const usersRouter = require('./controllers/users')
const membersRouter = require('./controllers/members')
const loginRouter = require('./controllers/login')
const negotiationsRouter = require('./controllers/negotiations')
const phraseRouter = require('./controllers/phrase')
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

//app.use(express.static('build'))
app.use(cors())
app.use(bodyParser.json())

app.use(middleware.tokenExtractor)

app.use('/api/cpkeys', cpkeysRouter)
app.use('/api/users', usersRouter)
app.use('/api/members', membersRouter)
app.use('/api/login', loginRouter)
app.use('/api/negotiations', negotiationsRouter)
app.use('/api/phrase', phraseRouter)
app.use('/api/resetDB', resetRouter)

/*if (process.env.NODE_ENV === 'test') {
	const testingRouter = require('./controllers/testing')
	app.use('/api/testing', testingRouter)
}*/

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app