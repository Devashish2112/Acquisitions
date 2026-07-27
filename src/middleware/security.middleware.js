import aj from "../config/arcjet.js";
import logger from "#config/logger.js";
import { slidingWindow } from "@arcjet/node";

const securityMiddleware = async (req, res, next) => {
    try {
        const role = req.user?.role || 'guest';

        let limit;
        switch (role) {
            case 'admin':
            limit = 20;
            break;
        case 'user':
            limit = 10;
            break;
        case 'guest':
            limit = 5;
            break;
        }

        const client = aj.withRule(slidingWindow({ mode: "LIVE", interval: '1m', max: limit, name: `${role}-rate-limit` }));

        const decision = await client.protect(req);

        if(decision.isDenied() && decision.reason.isBot()) {
            logger.warn('Bot request Blocked: ', { ip: req.ip, userAgent: req.get('user-agent'), path: req.path });
            return res.status(403).json({ error: 'Forbidden', message: 'Bot request blocked' });
        }

        if(decision.isDenied() && decision.reason.isShield()) {
            logger.warn('Shield Blocked Request: ', { ip: req.ip, userAgent: req.get('user-agent'), path: req.path, method:req.method });
            return res.status(403).json({ error: 'Forbidden', message: 'Request Blocked by securtiy policy' });
        }

        if(decision.isDenied() && decision.reason.isRateLimit()) {
            logger.warn('Rate Limit Exceeded: ', { ip: req.ip, userAgent: req.get('user-agent'), path: req.path });
            return res.status(429).json({ error: 'Too Many Requests', message: 'Request limit exceeded' });
        }

        next();
    } catch (e) {
        console.error('Error in security middleware:', e);
        res.status(500).json({ error: 'Internal Server Error', message: 'Something went wrong' });
    }
}

export default securityMiddleware;