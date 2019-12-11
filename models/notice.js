const mongoose = require('mongoose')

const noticeSchema = mongoose.Schema({
	content: {
		type: String,
		required: true,
	}
})

noticeSchema.set('toJSON', {
	transform: (document, returnedObject) => {
		returnedObject.id = returnedObject._id.toString()
		delete returnedObject._id
		delete returnedObject.__v
	}
})

module.exports = mongoose.model('Notice', noticeSchema)