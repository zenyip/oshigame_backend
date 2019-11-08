const membersRouter = require('express').Router()
const Member = require('../models/member')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

const generationSortValue = checkGen => {
	const genList = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th', '13th', '14th', '15th', 'D1', 'Sis', 'T8', 'D2', 'TW', '16th', 'D3']

	let gen = checkGen
	if (gen === 'HKT-1st') {
		gen = 'Sis'
	}

	return genList.indexOf(gen)
}

membersRouter.get('/', async (request, response) => {
	const members = await Member.find({}).populate('fans negotiation agency')
	response.json(members.map(m => m.toJSON()))
})

membersRouter.post('/', async (request, response, next) => {
	try {
		const decodedToken = jwt.verify(request.token, process.env.SECRET)
		if (!request.token || !decodedToken.id) {
			return response.status(401).json({ error: 'token missing or invalid' })
		}

		const user = await User.findById(decodedToken.id)

		if (!user || !user.admin) {
			return response.status(401).json({ error: 'access limited to admin only' })
		}

		const body = request.body.newMember
		const generation = {
			name: body.generation,
			sortValue : generationSortValue(body.generation)
		}

		const member = new Member({
			name_e: body.name_e,
			name_j: body.name_j,
			name_k: body.name_k,
			nickname: body.nickname,
			birthday: body.birthday,
			hometown: body.hometown,
			generation,
			pic_link: body.pic_link,
			team: body.team,
			agency: null,
			value: 480,
			current: body.current,
			kks: body.kks
		})

		const savedMember = await member.save()

		response.json(savedMember)
	} catch (exception) {
		next(exception)
	}
})

module.exports = membersRouter