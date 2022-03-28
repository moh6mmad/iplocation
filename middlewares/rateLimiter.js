const rateLimit = require('express-rate-limit')

const limiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minutes
	max: 1, // Limit each IP to 10 requests per `window` (here, per 1 minutes)
    message:
		'Too many requests has been sent from this IP, please try again after an hour. To increase the limit, please contact hi@iploc.info',
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = { limiter };
