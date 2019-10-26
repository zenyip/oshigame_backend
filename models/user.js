const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const userSchema = mongoose.Schema({
	username: {
		type: String,
		minlength: 3,
		unique: true,
		required: true
	},
	displayname: {
		type: String,
		require: true
	},
	passwordHash: String,
	oshimens: [
		{
			member: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Member'
			},
			relation: Number,
		}
	]
})

userSchema.set('toJSON', {
	transform: (document, returnedObject) => {
		returnedObject.id = returnedObject._id.toString()
		delete returnedObject._id
		delete returnedObject.__v
		delete returnedObject.passwordHash
	}
})

userSchema.plugin(uniqueValidator)

module.exports = mongoose.model('User', userSchema)