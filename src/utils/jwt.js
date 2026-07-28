import jwt from 'jsonwebtoken';
import logger from '#config/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'YourSecretKey'; // Replace with your own secret key

const JWT_EXPIRES_IN = '1d';

export const jwttoken = {
  sign: payload => {
    try {
      return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    } catch (e) {
      logger.error('Error signing JWT token:', e);
      throw new Error('Error signing JWT token', { cause: e });
    }
  },

  verify: token => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (e) {
      logger.error('Error verifying JWT token:', e);
      throw new Error('Error verifying JWT token', { cause: e });
    }
  },
};
