function checkApiKey(req, res, next) {
    const clientKey = req.header('x-api-key');
    if (!clientKey || clientKey !== process.env.TERRAIN_API_KEY) {
        return res.status(403).json({ error: 'Forbidden: invalid API key' });
    }
    next();
}

module.exports = checkApiKey;
