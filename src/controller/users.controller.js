import logger from '#config/logger.js';
import {
  getAllUsers,
  getUserById as getUserByIdService,
  updateUser as updateUserService,
  deleteUser as deleteUserService,
} from '#services/users.services.js';
import {
  userIdSchema,
  updateUserSchema,
} from '../validations/users.validation.js';
import { formatValidationError } from '../utils/format.js';

export const fetchAllUsers = async (req, res, next) => {
  try {
    logger.info('Fetching users ...');
    const allUsers = await getAllUsers();
    res.json({
      message: 'Successfully recieved users',
      users: allUsers,
      count: allUsers.length,
    });
  } catch (e) {
    logger.error(e);
    next(e);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const paramValidation = userIdSchema.safeParse(req.params);
    if (!paramValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(paramValidation.error),
      });
    }

    const { id } = paramValidation.data;
    logger.info(`Fetching user with ID: ${id}`);

    const user = await getUserByIdService(id);
    if (!user) {
      logger.warn(`User not found with ID: ${id}`);
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      message: 'Successfully received user',
      user,
    });
  } catch (e) {
    logger.error(`Error in getUserById for ID ${req.params.id}:`, e);
    next(e);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const paramValidation = userIdSchema.safeParse(req.params);
    if (!paramValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(paramValidation.error),
      });
    }

    const bodyValidation = updateUserSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(bodyValidation.error),
      });
    }

    const { id } = paramValidation.data;
    const updates = bodyValidation.data;

    if (!req.user) {
      return res
        .status(401)
        .json({ error: 'Unauthorized', message: 'Authentication required' });
    }

    // Non-admin users can only update their own information
    if (req.user.role !== 'admin' && Number(req.user.id) !== Number(id)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are only allowed to change your own information',
      });
    }

    // Only admin users can change the role of any user
    if (updates.role !== undefined && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only admin users are permitted to change user roles',
      });
    }

    logger.info(`Updating user with ID: ${id}`);
    const updatedUser = await updateUserService(id, updates);

    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (e) {
    logger.error(`Error in updateUser for ID ${req.params.id}:`, e);
    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
    next(e);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const paramValidation = userIdSchema.safeParse(req.params);
    if (!paramValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(paramValidation.error),
      });
    }

    const { id } = paramValidation.data;

    if (!req.user) {
      return res
        .status(401)
        .json({ error: 'Unauthorized', message: 'Authentication required' });
    }

    if (req.user.role !== 'admin' && Number(req.user.id) !== Number(id)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are only allowed to delete your own profile',
      });
    }

    logger.info(`Deleting user with ID: ${id}`);
    await deleteUserService(id);

    res.status(200).json({
      message: 'User deleted successfully',
    });
  } catch (e) {
    logger.error(`Error in deleteUser for ID ${req.params.id}:`, e);
    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
    next(e);
  }
};
