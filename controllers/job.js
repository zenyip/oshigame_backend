const jobRouter = require('express').Router()
const User = require('../models/user')
const Member = require('../models/member')
const jwt = require('jsonwebtoken')

jobRouter.post('/assign', async (request, response, next) => {
	try {
		const body = request.body

		const decodedToken = jwt.	verify(request.token, process.env.SECRET)
		if (!request.token || !decodedToken.id) {
			return response.status(401).json({ error: 'token missing or invalid' })
		}

		const user = await User.findById(decodedToken.id)
		const member = await Member.findById(body.memberId)

		if (!member.agency.toString().includes(user.id.toString())) {
			return response.status(400).json({ error: 'this member is not under your agency, operation not allow' })
		}

		if (member.job.name) {
			return response.status(400).json({ error: 'this member is already working' })
		}

		const startTime = Date.now()
		let endTime = startTime
		let feeNeeded = 0

		switch(body.jobType) {
		case 'SHOWROOM': {
			endTime += 3600000
			break
		}
		case 'HANDSHAKE': {
			endTime += 3600000 * 4
			feeNeeded = 4 * Math.floor(member.value/10)
			break
		}
		case 'TV': {
			endTime += 3600000 * 2
			feeNeeded = 2 * Math.floor(member.value/10) + 1000
			break
		}
		default :
		}

		if (user.assest < feeNeeded) {
			return response.status(400).json({ error: 'you do not have enough money' })
		}

		const userUpdate = {
			assest: user.assest - feeNeeded
		}
		await User.findByIdAndUpdate(decodedToken.id, userUpdate, { new: true })

		const memberUpdate = {
			job:{
				name: body.jobType,
				endTime
			}
		}
		const updatedMember = await Member.findByIdAndUpdate(body.memberId, memberUpdate, { new: true })
		response.json(updatedMember)
	} catch (exception) {
		next(exception)
	}
})

jobRouter.put('/cancel', async (request, response, next) => {
	try {
		const body = request.body

		const decodedToken = jwt.verify(request.token, process.env.SECRET)
		if (!request.token || !decodedToken.id) {
			return response.status(401).json({ error: 'token missing or invalid' })
		}

		const user = await User.findById(decodedToken.id)
		const member = await Member.findById(body.memberId)

		if (!member.agency.toString().includes(user.id.toString())) {
			return response.status(400).json({ error: 'this member is not under your agency, operation not allow' })
		}

		const memberUpdate = {
			job: {}
		}
		const updatedMember = await Member.findByIdAndUpdate(body.memberId, memberUpdate, { new: true })
		response.json(updatedMember)
	} catch (exception) {
		next(exception)
	}
})

jobRouter.put('/collect', async (request, response, next) => {
	try {
		const body = request.body

		const decodedToken = jwt.	verify(request.token, process.env.SECRET)
		if (!request.token || !decodedToken.id) {
			return response.status(401).json({ error: 'token missing or invalid' })
		}

		const user = await User.findById(decodedToken.id)
		const member = await Member.findById(body.memberId)

		if (!member.agency.toString().includes(user.id.toString())) {
			return response.status(400).json({ error: 'this member is not under your agency, operation not allow' })
		}

		if (!member.job.name) {
			return response.status(400).json({ error: 'this member does not have any assignment' })
		}

		const currentTime = new Date(Date.now())
		const endTime = member.job.endTime

		const endTimeMS = Date.parse(endTime)
		const currentTimeMS = Date.parse(currentTime)
		const collectable = (currentTimeMS - endTimeMS) > 0 ? true : false

		if (!collectable) {
			return response.status(400).json({ error: 'this assignment is not ready to collect' })
		}

		let fanReward = 0
		let moneyReward = 0

		const constRandomRange = (min, max) => {
			return min + Math.floor(Math.random() * (max - min))
		}
		const fanBasedRandomRange = (minRate, maxRate) => {
			return Math.floor(member.fanSize * (minRate + Math.random() * (maxRate - minRate)))
		}

		switch(member.job.name) {
		case 'SHOWROOM': {
			fanReward = constRandomRange(0, 100)
			moneyReward = fanBasedRandomRange(0, 0.1)
			break
		}
		case 'HANDSHAKE': {
			moneyReward = fanBasedRandomRange(0.4, 1)
			break
		}
		case 'TV': {
			fanReward = constRandomRange(500, 1000)
			break
		}
		default :
		}

		const memberUpdate = {
			fanSize: member.fanSize + fanReward,
			job: {}
		}
		await Member.findByIdAndUpdate(body.memberId, memberUpdate, { new: true })

		const userUpdate = {
			assest: user.assest + moneyReward
		}
		await User.findByIdAndUpdate(decodedToken.id, userUpdate, { new: true })
		const collectedRewards = {
			fanReward,
			moneyReward
		}
		response.json(collectedRewards)
	} catch (exception) {
		next(exception)
	}
})

module.exports = jobRouter