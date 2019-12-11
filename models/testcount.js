const mongoose = require('mongoose')

const testcountSchema = mongoose.Schema({
	backendCount: {
		type: Number,
		required: true
	},
	frontendCount: {
		type: Number,
		required: true
	}
})

testcountSchema.set('toJSON', {
	transform: (document, returnedObject) => {
		returnedObject.id = returnedObject._id.toString()
		delete returnedObject._id
		delete returnedObject.__v
	}
})

module.exports = mongoose.model('Testcount', testcountSchema)