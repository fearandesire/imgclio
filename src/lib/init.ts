/**
 * Startup / Bootstrap App Logic
 */

import { Logger } from '../utils/logger.js';
import { CustomClient } from './discord/client.js';
import { PrismaWrapper } from './prisma.js';
/**
 * Initialize database connection
 */
async function initializeDatabase() {
	const prismaWrapper = PrismaWrapper.getInstance();
	try {
		await prismaWrapper.connect();
		Logger.info('Database connection established');
		return prismaWrapper;
	} catch (error) {
		Logger.error('Failed to connect to database', error);
		throw error;
	}
}

/**
 * Initialize Discord client
 */
async function initializeDiscord() {
	const discordClient = new CustomClient();
	await discordClient.start();
}

/**
 * Initialize App
 */
export async function initializeApp() {
	await initializeDatabase();
	await initializeDiscord();
}
