import { container } from '@sapphire/framework';
import { Collection } from 'discord.js';
import type { ApplicationCommand, Client } from 'discord.js';
import type { CustomClient } from '../../lib/discord/client.js';

export type CommandType = 'global' | 'guild' | 'all';

export interface CommandCollections {
	global: Collection<string, ApplicationCommand>;
	guild: Collection<string, ApplicationCommand>;
}

export type CommandSource = 'global' | 'guild';

export interface CommandSearchResult {
	command: ApplicationCommand;
	source: CommandSource;
}

interface CommandSearchOptions {
	commandName: string;
	guildId?: string | null;
}

/**
 * A service for managing and querying registered commands in the Discord bot
 * Provides methods to fetch all commands, find commands by name, and get command mentions
 */
export class CommandRegistry {
	private readonly client: CustomClient | Client;

	constructor(client: CustomClient | Client) {
		this.client = client;
	}

	/**
	 * Retrieves all registered commands from the Discord bot
	 * @returns An object containing separate collections for global and guild commands
	 * @throws Error if commands cannot be fetched or client is not ready
	 */
	public async getAllCommands(
		guildId?: string | null,
	): Promise<CommandCollections> {
		if (!this.client.isReady()) {
			throw new Error('Client is not ready');
		}

		try {
			// Fetch global commands
			const globalCommands = await this.client.application.commands.fetch();

			// Only fetch guild commands if guildId is provided
			let guildCommands = new Collection<string, ApplicationCommand>();
			if (guildId) {
				guildCommands = await this.client.application.commands.fetch({
					guildId,
				});
			}

			return {
				global: globalCommands,
				guild: guildCommands,
			};
		} catch (error) {
			container.logger.error('Failed to fetch commands:', error);
			throw new Error(
				`Failed to fetch commands: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}
	}

	/**
	 * Finds a command by its name
	 * @param options - Search options containing command name and optional guild ID
	 * @returns The found command and its source, or null if not found
	 * @throws Error if commands cannot be fetched or client is not ready
	 */
	public async findCommandByName(
		options: CommandSearchOptions,
	): Promise<CommandSearchResult | null> {
		const { commandName, guildId } = options;
		const commands = await this.getAllCommands(guildId);
		const searchName = commandName.toLowerCase();

		// If guildId is provided, search guild commands first
		if (guildId) {
			const guildCommand = commands.guild.find(
				(cmd) => cmd.name === searchName,
			);
			if (guildCommand) {
				return {
					command: guildCommand,
					source: 'guild',
				};
			}
		}

		// Search global commands (either as fallback or as primary search)
		const globalCommand = commands.global.find(
			(cmd) => cmd.name === searchName,
		);
		if (globalCommand) {
			return {
				command: globalCommand,
				source: 'global',
			};
		}

		return null;
	}

	/**
	 * Gets the command ID string for use in Discord message formatting
	 * @param options - Search options containing command name and optional guild ID
	 * @returns Formatted command string or null if command not found
	 */
	public async getCommandMention(
		options: CommandSearchOptions,
	): Promise<string | null> {
		const result = await this.findCommandByName(options);
		if (!result) return null;
		return `</${result.command.name}:${result.command.id}>`;
	}
}
