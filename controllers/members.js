const membersRouter = require('express').Router()
const Member = require('../models/member')

membersRouter.get('/', async (request, response) => {
	const members = await Member.find({}).populate('fans')
	response.json(members.map(m => m.toJSON()))
})

membersRouter.post('/', async (request, response, next) => {
	try {
		const body = request.body

		const member = new Member({
			name_e: body.name_e,
			name_j: body.name_j,
			nickname: body.nickname,
			birthday: body.birthday,
			hometown: body.hometown,
			pic_link: body.pic_link,
			fans: []
		})

		const savedMember = await member.save()

		response.json(savedMember)
	} catch (exception) {
		next(exception)
	}
})

module.exports = membersRouter