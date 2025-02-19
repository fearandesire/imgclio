import '@lib/env.js';
import '@sapphire/plugin-logger/register';
import { initializeApp } from './lib/init.js';
import { ErrorHandler } from './utils/error-handler.js';
import { Logger } from './utils/logger.js';
import '@lib/discord/config/sapphire-setup.js';
async function main() {
	// Initialize core services
	const errorHandler = new ErrorHandler(Logger);

	try {
		await initializeApp();
		Logger.info('Application initialized successfully');
	} catch (error) {
		errorHandler.handleFatalError(error);
		process.exit(1);
	}
}

await main();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
	Logger.info('SIGTERM received. Starting graceful shutdown...');
	process.exit(0);
});
