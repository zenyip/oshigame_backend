const phraseCheck = () => {
	const serverTime = new Date(Date.now())
	const JPDay = new Date(Date.parse(new Date(serverTime)) + 9 * 3600000).getUTCDay()
	let phrase = ''
	switch (JPDay) {
	case 0:
		phrase = 'general'
		break
	case 1:
		phrase = 'general'
		break
	case 2:
		phrase = 'general'
		break
	case 3:
		phrase = 'general'
		break
	case 4:
		phrase = 'general'
		break
	case 5:
		phrase = 'rest-day'
		break
	case 6:
		phrase = 'negotiation'
		break
	default:
	}
	return phrase
}

module.exports = phraseCheck