const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const memberSchema = mongoose.Schema({
	name_e: {
		type: String,
		required: true
	},
	name_j: {
		type: String,
		required: true
	},
	nickname: String,
	birthday: Date,
	hometown: String,
	pic_link: String,
	team: [String],
	fans: [
		{
			user: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User'
			},
			relation: Number,
		}
	]
})

memberSchema.set('toJSON', {
	transform: (document, returnedObject) => {
		returnedObject.id = returnedObject._id.toString()
		delete returnedObject._id
		delete returnedObject.__v
	}
})

memberSchema.plugin(uniqueValidator)

module.exports = mongoose.model('Member', memberSchema)