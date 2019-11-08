const mongoose = require('mongoose')

const phraseSchema = mongoose.Schema({
	identifier: {
		type: String,
		required: true,
	},
	phrase: {
		type: String,
		required: true,
	},
})

phraseSchema.set('toJSON', {
	transform: (document, returnedObject) => {
		delete returnedObject._id
		delete returnedObject.__v
	}
})

module.exports = mongoose.model('Status', phraseSchema)