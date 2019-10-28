const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const cpkeySchema = mongoose.Schema({
	key: {
		type: String,
		minlength: 3,
		required: true,
		unique: true,
	},
})

cpkeySchema.set('toJSON', {
	transform: (document, returnedObject) => {
		returnedObject.id = returnedObject._id.toString()
		delete returnedObject._id
		delete returnedObject.__v
	}
})

cpkeySchema.plugin(uniqueValidator)

module.exports = mongoose.model('Cpkey', cpkeySchema)