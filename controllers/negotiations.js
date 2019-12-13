const negotiationsRouter = require('express').Router()
const User = require('../models/user')
const Negotiation = require('../models/negotiation')
const Member = require('../models/member')
const jwt = require('jsonwebtoken')

negotiationsRouter.get('/', async (request, response, next) => {
	try {
		const decodedToken = jwt.verify(request.token, process.env.SECRET)
		if (!request.token || !decodedToken.id) {
			return response.status(401).json({ error: 'token missing or invalid' })
		}

		const user = await User.findById(decodedToken.id)

		if (!user || !user.admin) {
			return response.status(401).json({ error: 'access limited to admin only' })
		}

		const fullNegotiations = await Negotiation.find({}).populate('member applicant')
		response.json(fullNegotiations.map(negotiation => negotiation.toJSON()))

	} catch (exception) {
		next(exception)
	}
})

negotiationsRouter.get('/currentbids', async (request, response, next) => {
	try {
		let negotiations = await Negotiation.find({ tradeType: 'bid' }).populate('member')
		negotiations = negotiations.map(n => {
			if (n.member.pic_link.length < 10) {
				n.member.pic_link = 'https://s.akb48.co.jp/members/profile/renew190501/' + n.member.pic_link + '.jpg'
			}
			return {
				'memberId': n.member.id,
				'nickname': n.member.nickname,
				'pic_link': n.member.pic_link,
				'firstname_e': n.member.name_e.firstname,
				'lastname_e': n.member.name_e.lastname,
				'bid': n.bid,
				'id': n.id
			}
		})
		response.json(negotiations)
	} catch (exception) {
		next(exception)
	}
})

negotiationsRouter.get('/byUserToken', async (request, response, next) => {
	try {
		const decodedToken = jwt.verify(request.token, process.env.SECRET)
		if (!request.token || !decodedToken.id) {
			return response.status(401).json({ error: 'token missing or invalid' })
		}

		const user = await User.findById(decodedToken.id).populate('oshimens')
		if (!user) {
			return response.status(400).json({ error: 'user not found' })
		}

		const negotiations = await Negotiation.find({ applicant : user.id })
		response.json(negotiations.map(negotiation => negotiation.toJSON()))
	} catch (exception) {
		next(exception)
	}
})

negotiationsRouter.post('/', async (request, response, next) => {
	try {
		const body = request.body

		const decodedToken = jwt.verify(request.token, process.env.SECRET)
		if (!request.token || !decodedToken.id) {
			return response.status(401).json({ error: 'token missing or invalid' })
		}

		let user = await User.findById(decodedToken.id)

		if (user.oshimens.includes(body.memberId) && body.tradeType !== 'release') {
			return response.status(400).json({ error: 'the member is already in your agency' })
		}

		if (body.tradeType === 'bid') {

			if (user.assest < body.bid) {
				return response.status(400).json({ error: 'you do not have enough money' })
			}

			const member = await Member.findById(body.memberId)

			if (body.bid < member.value) {
				return response.status(400).json({ error: 'your bid is too low' })
			}

			const oldApplication = await Negotiation.findOne({ member: body.memberId, tradeType: 'bid' })
			if (oldApplication) {
				if (body.bid < oldApplication.bid + 10) {
					return response.status(400).json({ error: 'new bid have to be at least 10 higher than the current bid' })
				}
				const oldApplicant = await User.findById(oldApplication.applicant)
				const updatedNegotiations = oldApplicant.negotiations.filter(n => !n.toString().includes(oldApplication.id))
				const update = {
					assest: oldApplicant.assest + oldApplication.bid,
					negotiations: updatedNegotiations
				}
				await User.findByIdAndUpdate(oldApplicant.id, update, { new: true })
			}
			user = await User.findById(decodedToken.id)
			const update = { assest: user.assest - body.bid }
			await User.findByIdAndUpdate(user.id, update, { new: true })
			let savedNegotiation

			if (oldApplication) {
				const update = {
					bid: body.bid,
					applicant: user.id
				}
				savedNegotiation = await Negotiation.findByIdAndUpdate(oldApplication.id, update, { new: true })
			} else {
				const negotiation = new Negotiation({
					member: member.id,
					bid: body.bid,
					tradeType: body.tradeType,
					applicant: user.id
				})
				savedNegotiation = await negotiation.save()
				const memberUpdate = {
					negotiation: savedNegotiation.id
				}
				await Member.findByIdAndUpdate(member.id, memberUpdate, { new: true })
			}
			const applicantUpdate = {
				negotiations: user.negotiations.concat(savedNegotiation.id)
			}
			await User.findByIdAndUpdate(user.id, applicantUpdate, { new: true })
			response.json(savedNegotiation)
		}

		if (body.tradeType === 'offer') {
			if (user.assest < body.bid) {
				return response.status(400).json({ error: 'you do not have enough money' })
			}

			const member = await Member.findById(body.memberId)
			if (!member.agency.toString().includes(body.recipient.id.toString())) {
				return response.status(400).json({ error: 'this member is no longer under this agency, please refresh the page' })
			}

			const oldOffer = await Negotiation.findOne({ member: body.memberId, tradeType: 'offer', applicant: user.id })
			if (oldOffer) {
				return response.status(400).json({ error: 'only one valid offer is allowed each time per member' })
			}

			const negotiation = new Negotiation({
				member: body.memberId,
				bid: body.bid,
				tradeType: body.tradeType,
				applicant: user.id,
				recipient: body.recipient.id
			})
			const savedNegotiation = await negotiation.save()

			const recipient = await User.findById(body.recipient.id)
			const recipientUpdate = {
				negotiations: recipient.negotiations.concat(savedNegotiation.id)
			}
			await User.findByIdAndUpdate(recipient.id, recipientUpdate, { new: true })

			const applicantUpdate = {
				assest: user.assest - body.bid,
				negotiations: user.negotiations.concat(savedNegotiation.id)
			}
			await User.findByIdAndUpdate(user.id, applicantUpdate, { new: true })

			response.json(savedNegotiation)
		}

		if (body.tradeType === 'force') {
			if (user.assest < body.bid) {
				return response.status(400).json({ error: 'you do not have enough money' })
			}

			const member = await Member.findById(body.memberId)
			if (!member.agency.toString().includes(body.recipient.id.toString())) {
				return response.status(400).json({ error: 'this member is no longer under this agency, please refresh the page' })
			}

			const negotiation = new Negotiation({
				member: body.memberId,
				bid: body.bid,
				tradeType: body.tradeType,
				applicant: user.id,
				recipient: body.recipient.id
			})
			const savedNegotiation = await negotiation.save()

			const recipient = await User.findById(body.recipient.id)
			const updatedRecipentOshimens = recipient.oshimens.filter(o => !o.toString().includes(body.memberId))
			const recipientUpdate = {
				assest: recipient.assest + body.bid,
				oshimens: updatedRecipentOshimens,
				negotiations: recipient.negotiations.concat(savedNegotiation.id)
			}
			await User.findByIdAndUpdate(recipient.id, recipientUpdate, { new: true })

			const memberUpdate = {
				agency: user.id,
				value: body.bid
			}
			await Member.findByIdAndUpdate(body.memberId, memberUpdate, { new: true })

			const applicantUpdate = {
				assest: user.assest - body.bid,
				oshimens: user.oshimens.concat(body.memberId),
				negotiations: user.negotiations.concat(savedNegotiation.id)
			}
			await User.findByIdAndUpdate(user.id, applicantUpdate, { new: true })

			const affectedOffers = await Negotiation.find({ member: member.id, tradeType: 'offer' })
			for (let i = 0; i < affectedOffers.length; i++) {
				const affectedApplicant = await User.findById(affectedOffers[i].applicant)
				const updatedApplicantNegotiations = affectedApplicant.negotiations.filter(n => !n.toString().includes(affectedOffers[i].id))
				const updateApplicant = {
					assest: affectedApplicant.assest + affectedOffers[i].bid,
					negotiations: updatedApplicantNegotiations
				}
				await User.findByIdAndUpdate(affectedApplicant.id, updateApplicant, { new: true })

				const affectedRecipient = await User.findById(affectedOffers[i].recipient)
				const updatedRecipientNegotiations = affectedRecipient.negotiations.filter(n => !n.toString().includes(affectedOffers[i].id))
				const updateRecipient = {
					negotiations: updatedRecipientNegotiations
				}
				await User.findByIdAndUpdate(affectedRecipient.id, updateRecipient, { new: true })

				await Negotiation.findByIdAndDelete(affectedOffers[i].id)
			}

			response.json(savedNegotiation)
		}

		if (body.tradeType === 'late') {
			if (user.oshimens.length >= 3) {
				return response.status(400).json({ error: 'late signing only available for agency with less than 3 members' })
			}

			if (user.assest < body.bid) {
				return response.status(400).json({ error: 'you do not have enough money' })
			}

			const member = await Member.findById(body.memberId)
			if (member.agency) {
				return response.status(400).json({ error: 'this member already has an agency' })
			}

			const negotiation = new Negotiation({
				member: body.memberId,
				bid: body.bid,
				tradeType: body.tradeType,
				applicant: user.id,
			})
			const savedNegotiation = await negotiation.save()

			const memberUpdate = {
				agency: user.id,
				value: body.bid
			}
			await Member.findByIdAndUpdate(body.memberId, memberUpdate, { new: true })

			const applicantUpdate = {
				assest: user.assest - body.bid,
				oshimens: user.oshimens.concat(body.memberId),
				negotiations: user.negotiations.concat(savedNegotiation.id)
			}
			await User.findByIdAndUpdate(user.id, applicantUpdate, { new: true })

			response.json(savedNegotiation)
		}

		if (body.tradeType === 'release') {
			const member = await Member.findById(body.memberId)
			if (!member.agency.toString().includes(user.id.toString())) {
				return response.status(400).json({ error: 'this member is not under your agency, release not allowed' })
			}

			let freeAgentPrice = Math.floor(member.fanSize * 0.8)
			if (freeAgentPrice < 480) {
				freeAgentPrice = 480
			}

			const memberUpdate = {
				agency: null,
				value: freeAgentPrice,
				job: {},
				tradable: true
			}
			await Member.findByIdAndUpdate(member.id, memberUpdate, { new: true })

			const updatedOshimens = user.oshimens.filter(o => !o.toString().includes(member.id.toString()))
			const update = {
				assest: user.assest + body.bid,
				oshimens: updatedOshimens
			}
			await User.findByIdAndUpdate(user.id, update, { new: true })

			const negotiation = new Negotiation({
				member: member.id,
				bid: body.bid,
				tradeType: body.tradeType,
				applicant: user.id
			})
			const savedNegotiation = await negotiation.save()
			const applicantUpdate = {
				negotiations: user.negotiations.concat(savedNegotiation.id)
			}
			await User.findByIdAndUpdate(user.id, applicantUpdate, { new: true })

			const affectedOffers = await Negotiation.find({ member: member.id, tradeType: 'offer' })
			for (let i = 0; i < affectedOffers.length; i++) {
				const applicant = await User.findById(affectedOffers[i].applicant)
				const updatedApplicantNegotiations = applicant.negotiations.filter(n => !n.toString().includes(affectedOffers[i].id))
				const updateApplicant = {
					assest: applicant.assest + affectedOffers[i].bid,
					negotiations: updatedApplicantNegotiations
				}
				await User.findByIdAndUpdate(applicant.id, updateApplicant, { new: true })

				const updatedRecipientNegotiations = user.negotiations.filter(n => !n.toString().includes(affectedOffers[i].id))
				const updateRecipient = {
					negotiations: updatedRecipientNegotiations
				}
				await User.findByIdAndUpdate(user.id, updateRecipient, { new: true })

				await Negotiation.findByIdAndDelete(affectedOffers[i].id)
			}

			response.json(savedNegotiation)
		}
	} catch (exception) {
		next(exception)
	}
})

negotiationsRouter.post('/accept', async (request, response, next) => {
	try {
		const body = request.body

		const decodedToken = jwt.verify(request.token, process.env.SECRET)
		if (!request.token || !decodedToken.id) {
			return response.status(401).json({ error: 'token missing or invalid' })
		}

		const user = await User.findById(decodedToken.id)
		if (!user) {
			return response.status(400).json({ error: 'user not found' })
		}

		const negotiation = await Negotiation.findById(body.negotiationId)
		if (!negotiation) {
			return response.status(400).json({ error: 'negotiation not found' })
		}

		const updatedRecipentOshimens = user.oshimens.filter(o => !o.toString().includes(negotiation.member))
		const updatedRecipentNegotiations = user.negotiations.filter(n => !n.toString().includes(negotiation.id))
		const recipientUpdate = {
			assest: user.assest + negotiation.bid,
			oshimens: updatedRecipentOshimens,
			negotiations: updatedRecipentNegotiations
		}
		await User.findByIdAndUpdate(user.id, recipientUpdate, { new: true })

		const applicant = await User.findById(negotiation.applicant)
		const updatedApplicantNegotiations = applicant.negotiations.filter(n => !n.toString().includes(negotiation.id))
		const applicantUpdate = {
			oshimens: applicant.oshimens.concat(negotiation.member),
			negotiations: updatedApplicantNegotiations
		}
		await User.findByIdAndUpdate(applicant.id, applicantUpdate, { new: true })

		const memberUpdate = {
			agency: negotiation.applicant,
			value: negotiation.bid
		}
		await Member.findByIdAndUpdate(negotiation.member, memberUpdate, { new: true })

		await Negotiation.findByIdAndDelete(negotiation.id)

		const affectedOffers = await Negotiation.find({ member: negotiation.member, tradeType: 'offer' })
		for (let i = 0; i < affectedOffers.length; i++) {
			const affectedApplicant = await User.findById(affectedOffers[i].applicant)
			const updatedApplicantNegotiations = affectedApplicant.negotiations.filter(n => !n.toString().includes(affectedOffers[i].id))
			const updateApplicant = {
				assest: affectedApplicant.assest + affectedOffers[i].bid,
				negotiations: updatedApplicantNegotiations
			}
			await User.findByIdAndUpdate(affectedApplicant.id, updateApplicant, { new: true })

			const affectedRecipient = await User.findById(affectedOffers[i].recipient)
			const updatedRecipientNegotiations = affectedRecipient.negotiations.filter(n => !n.toString().includes(affectedOffers[i].id))
			const updateRecipient = {
				negotiations: updatedRecipientNegotiations
			}
			await User.findByIdAndUpdate(affectedRecipient.id, updateRecipient, { new: true })

			await Negotiation.findByIdAndDelete(affectedOffers[i].id)
		}

		const acceptedNegotiation = new Negotiation({
			member: negotiation.member,
			bid: negotiation.bid,
			tradeType: 'AcceptedOffer',
			applicant: negotiation.applicant
		})
		const savedNegotiation = await acceptedNegotiation.save()
		response.json(savedNegotiation)
	} catch (exception) {
		next(exception)
	}
})

negotiationsRouter.post('/reject', async (request, response, next) => {
	try {
		const body = request.body

		const decodedToken = jwt.verify(request.token, process.env.SECRET)
		if (!request.token || !decodedToken.id) {
			return response.status(401).json({ error: 'token missing or invalid' })
		}

		const user = await User.findById(decodedToken.id)
		if (!user) {
			return response.status(400).json({ error: 'user not found' })
		}

		const negotiation = await Negotiation.findById(body.negotiationId)
		if (!negotiation) {
			return response.status(400).json({ error: 'negotiation not found' })
		}

		const applicant = await User.findById(negotiation.applicant)
		const updatedApplicantNegotiations = applicant.negotiations.filter(n => !n.toString().includes(negotiation.id))
		const updateApplicant = {
			assest: applicant.assest + negotiation.bid,
			negotiations: updatedApplicantNegotiations
		}
		await User.findByIdAndUpdate(applicant.id, updateApplicant, { new: true })

		const updatedNegotiations = user.negotiations.filter(n => !n.toString().includes(negotiation.id))
		const update = {
			negotiations: updatedNegotiations
		}
		await User.findByIdAndUpdate(user.id, update, { new: true })

		await Negotiation.findByIdAndDelete(negotiation.id)

		response.json({ message: 'rejected' })
	} catch (exception) {
		next(exception)
	}
})

negotiationsRouter.post('/settle', async (request, response, next) => {
	try {
		const decodedToken = jwt.verify(request.token, process.env.SECRET)
		if (!request.token || !decodedToken.id) {
			return response.status(401).json({ error: 'token missing or invalid' })
		}

		const user = await User.findById(decodedToken.id)

		if (!user || !user.admin) {
			return response.status(401).json({ error: 'access limited to admin only' })
		}

		const bidNegotiations = await Negotiation.find({ tradeType: 'bid' })

		const settling = async () => {
			for (let i = 0; i < bidNegotiations.length; i++) {
				const memberUpdate = {
					negotiation: null,
					agency: bidNegotiations[i].applicant,
					value: bidNegotiations[i].bid
				}
				await Member.findByIdAndUpdate(bidNegotiations[i].member, memberUpdate, { new: true })
				const applicant = await User.findById(bidNegotiations[i].applicant)
				const userUpdate = {
					oshimens: applicant.oshimens.concat(bidNegotiations[i].member)
				}
				await User.findByIdAndUpdate(bidNegotiations[i].applicant, userUpdate, { new: true })
			}
		}

		await settling()

		await Negotiation.deleteMany({})
		const memberUpdate = {
			tradable: true
		}
		await Member.updateMany({}, memberUpdate, { new: true })
		const userUpdate = {
			negotiations : []
		}
		await User.updateMany({}, userUpdate, { new: true })

		response.status(200).json( { message: 'negotiations settled' } )
	} catch (exception) {
		next(exception)
	}
})

negotiationsRouter.post('/payrise', async (request, response, next) => {
	try {
		const body = request.body

		const decodedToken = jwt.verify(request.token, process.env.SECRET)
		if (!request.token || !decodedToken.id) {
			return response.status(401).json({ error: 'token missing or invalid' })
		}

		const user = await User.findById(decodedToken.id)

		if (!user.oshimens.includes(body.memberId)) {
			return response.status(400).json({ error: 'only owner of the member can access this function' })
		}

		if (body.amount <= 0) {
			return response.status(400).json({ error: 'pay rise amount have to be positive' })
		}

		if (user.assest < body.amount) {
			return response.status(400).json({ error: 'you do not have enough money' })
		}

		const member = await Member.findById(body.memberId)

		const userUpdate = {
			assest: user.assest - body.amount
		}
		await User.findByIdAndUpdate(user.id, userUpdate, { new: true })

		const memberUpdate = {
			value: Number(member.value) + Number(body.amount)
		}
		const updatedMember = await Member.findByIdAndUpdate(member.id, memberUpdate, { new: true })
		response.json(updatedMember)
	} catch (exception) {
		next(exception)
	}
})

module.exports = negotiationsRouter