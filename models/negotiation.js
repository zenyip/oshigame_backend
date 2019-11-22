const mongoose = require('mongoose')

const negotiationSchema = mongoose.Schema({
	member: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Member',
		required: true
	},
	bid: {
		type: Number,
		required: true
	},
	tradeType: {
		type: String,
		require: true
	},
	applicant: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	recipient: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	}
})

negotiationSchema.set('toJSON', {
	transform: (document, returnedObject) => {
		returnedObject.id = returnedObject._id.toString()
		delete returnedObject._id
		delete returnedObject.__v
	}
})

module.exports = mongoose.model('Negotiation', negotiationSchema)