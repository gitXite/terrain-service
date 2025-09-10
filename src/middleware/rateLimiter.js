const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // limit each API key to 60 requests per minute
    keyGenerator: (req) => req.headers['x-api-key'] || req.ip,
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = limiter;
