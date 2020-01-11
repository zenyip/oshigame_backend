const mongoose = require('mongoose')

const certBackgoundSchema = mongoose.Schema({
	identifier: {
		type: String,
		required: true,
	},
	imgLink: {
		type: String,
		minlength: 3,
		required: true,
	},
})

certBackgoundSchema.set('toJSON', {
	transform: (document, returnedObject) => {
		returnedObject.id = returnedObject._id.toString()
		delete returnedObject._id
		delete returnedObject.__v
	}
})

module.exports = mongoose.model('CertBackground', certBackgoundSchema)