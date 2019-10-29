const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const memberSchema = mongoose.Schema({
	name_e: {
		firstname: {
			type: String,
			required: true
		},
		lastname: {
			type: String,
			required: true
		}
	},
	name_j: {
		type: String,
		required: true
	},
	name_k: {
		firstname: {
			type: String,
			required: true
		},
		lastname: {
			type: String,
			required: true
		}
	},
	nickname: String,
	birthday: {
		type: Date,
		required: true
	},
	hometown: String,
	generation: {
		name: {
			type: String,
			required: true
		},
		sortValue : {
			type: Number,
			required: true
		},
	},
	pic_link: String,
	team: [String],
	agency: {
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		},
		relation: Number,
	},
	value: {
		type: Number,
		required: true
	},
	current: {
		type: Boolean,
		required: true
	},
	kks: {
		type: Boolean,
		required: true
	}
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