import type { PrismaClient } from '@prisma/client';
import { LogLevel, SapphireClient, container } from '@sapphire/framework';
import type { ClientOptions } from 'discord.js';
import { ActivityType, GatewayIntentBits } from 'discord.js';
import { DISCORD_TOKEN } from '../env.js';
import { PrismaWrapper } from '../prisma.js';

export class CustomClient extends SapphireClient {
	private statusUpdateInterval?: ReturnType<typeof setInterval>;

	constructor(options?: ClientOptions) {
		super({
			defaultPrefix: '$',
			shards: 'auto',
			regexPrefix: /^(hey +)?clio[,! ]/i,
			caseInsensitiveCommands: true,
			intents: [
				GatewayIntentBits.GuildIntegrations,
				GatewayIntentBits.DirectMessages,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.Guilds,
				GatewayIntentBits.MessageContent,
				GatewayIntentBits.GuildMembers,
			],
			loadMessageCommandListeners: true,
			logger: {
				level: LogLevel.Debug,
			},
			presence: {
				status: 'online',
			},
			typing: true,
			...options,
		});
	}

	private async updateStatus() {
		await this.user?.setActivity({
			name: 'clio.',
			type: ActivityType.Custom,
		});
	}

	public async start() {
		try {
			container.logger.info('Initializing client');
			await this.login(DISCORD_TOKEN);

			// Initial status update
			await this.updateStatus();

			// Set up hourly status updates
			this.statusUpdateInterval = setInterval(
				() => {
					this.updateStatus().catch((error) => {
						container.logger.error('Failed to update status:', error);
					});
				},
				60 * 60 * 1000,
			); // 1 hour in milliseconds

			container.logger.info('Client initialized and logged in');
		} catch (error) {
			container.logger.fatal(error);
			await this.destroy();
			process.exit(1);
		}
	}

	public override async login(token?: string) {
		// Attach Prisma to the container
		container.prisma = PrismaWrapper.getInstance().getClient();

		// Verify Prisma client is available
		if (!container.prisma) {
			container.logger.error('Database client not initialized');
			process.exit(1);
		}
		container.logger.info('Database client verified');

		return super.login(token);
	}

	public override async destroy() {
		// Clear the status update interval
		if (this.statusUpdateInterval) {
			clearInterval(this.statusUpdateInterval);
		}

		// Disconnect Prisma before destroying the client
		await container.prisma.$disconnect();
		container.logger.info('Disconnected from database');

		return super.destroy();
	}
}

// Extend the Container type
declare module '@sapphire/pieces' {
	interface Container {
		prisma: PrismaClient;
	}
}

// Augment the description fields for help commands (message commands)
declare module '@sapphire/framework' {
	export interface DetailedDescriptionCommandObject {
		usage: string;
		examples: string[];
		extendedHelp: string;
	}
}
