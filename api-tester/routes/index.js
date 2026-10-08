var express = require('express');
var router = express.Router();

router.all('/', function(req, res) {
	console.log('got request on an undefined route');
	console.log(req.summary);
	if (Boolean(req.query.echo)) {
		res.json(req.summary);
	} else {
		res.status(400).json({
			success: false,
			message: 'Undefined route.',
			input: req.summary
		});
	}
});

module.exports = router;