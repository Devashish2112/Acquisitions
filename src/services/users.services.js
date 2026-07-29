import logger from '#config/logger.js';
import { db } from '#config/database.js';
import { users } from '#models/user.model.js';
import { eq } from 'drizzle-orm';
import { hashpassword } from './auth.service.js';

export const getAllUsers = async () => {
  try {
    return await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.createdAt,
        updated_at: users.updatedAt,
      })
      .from(users);
  } catch (e) {
    logger.error('Error Getting users', e);
    throw e;
  }
};

export const getUserById = async id => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.createdAt,
        updated_at: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, Number(id)))
      .limit(1);

    return user || null;
  } catch (e) {
    logger.error(`Error getting user by id: ${id}`, e);
    throw e;
  }
};

export const updateUser = async (id, updates) => {
  try {
    const existingUser = await getUserById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    const updateData = { ...updates, updatedAt: new Date() };

    if (updates.password) {
      updateData.password = await hashpassword(updates.password);
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, Number(id)))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.createdAt,
        updated_at: users.updatedAt,
      });

    return updatedUser;
  } catch (e) {
    logger.error(`Error updating user ${id}:`, e);
    throw e;
  }
};

export const deleteUser = async id => {
  try {
    const existingUser = await getUserById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, Number(id)))
      .returning({
        id: users.id,
        email: users.email,
      });

    return deletedUser;
  } catch (e) {
    logger.error(`Error deleting user ${id}:`, e);
    throw e;
  }
};
