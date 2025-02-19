import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import type { DetailedDescriptionCommandObject } from '@sapphire/framework';
import type { Args } from '@sapphire/framework';
import {
	Colors,
	EmbedBuilder,
	type Message,
	bold,
	codeBlock,
} from 'discord.js';
import { CommandRegistry } from '../services/discord/command-registry.js';

@ApplyOptions<Command.Options>({
	description: 'View how to use the app or get help for a specific command',
	detailedDescription: {
		usage: '$help [command_name]',
		examples: ['/help', '/help makecommand', '$help', '$help listcommands'],
		extendedHelp:
			'Get help for all commands or specify a command name to see detailed information about that specific command.',
	},
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) =>
					option
						.setName('command')
						.setDescription('The command to get help for')
						.setRequired(false)
						.addChoices(
							...this.container.stores.get('commands').map((command) => ({
								name: command.name,
								value: command.name,
							})),
						),
				),
		);
	}

	public override async chatInputRun(
		interaction: Command.ChatInputCommandInteraction,
	) {
		const commandRegistry = new CommandRegistry(interaction.client);
		const commandName = interaction.options.getString('command');

		if (commandName) {
			const commandHelp = await this.getSpecificCommandHelp(
				commandName,
				commandRegistry,
				interaction.guildId,
			);
			return interaction.reply({ embeds: [commandHelp] });
		}

		const embed = await this.createDefaultHelpEmbed(
			commandRegistry,
			interaction.guildId,
			true,
		);
		return interaction.reply({ embeds: [embed] });
	}

	public override async messageRun(message: Message, args: Args) {
		const commandRegistry = new CommandRegistry(message.client);
		const commandName = await args.pick('string').catch(() => null);

		if (commandName) {
			const commandHelp = await this.getSpecificCommandHelp(
				commandName,
				commandRegistry,
				message.guildId,
			);
			return message.reply({ embeds: [commandHelp] });
		}

		const embed = await this.createDefaultHelpEmbed(
			commandRegistry,
			message.guildId,
			false,
		);
		return message.reply({ embeds: [embed] });
	}

	private async getSpecificCommandHelp(
		commandName: string,
		commandRegistry: CommandRegistry,
		guildId: string | null,
	): Promise<EmbedBuilder> {
		const commands = this.container.stores.get('commands');
		const command = commands.get(commandName);

		if (!command) {
			return new EmbedBuilder()
				.setColor(Colors.Red)
				.setTitle('Command Not Found')
				.setDescription(
					`The command \`${commandName}\` does not exist. Use \`/help\` to see all available commands.`,
				);
		}

		const cmdMention = await commandRegistry.getCommandMention({
			commandName: command.name,
			guildId: guildId,
		});

		const embed = new EmbedBuilder()
			.setColor(Colors.Blue)
			.setTitle(`Command: ${command.name}`)
			.setDescription(command.description);

		const detailedDescription = command.detailedDescription as
			| DetailedDescriptionCommandObject
			| undefined;

		if (detailedDescription) {
			if (detailedDescription.usage) {
				embed.addFields({
					name: '📝 Usage',
					value: codeBlock(detailedDescription.usage),
				});
			}

			if (detailedDescription.examples?.length) {
				embed.addFields({
					name: '💡 Examples',
					value: codeBlock(detailedDescription.examples.join('\n\n')),
				});
			}

			if (detailedDescription.extendedHelp) {
				embed.addFields({
					name: 'ℹ️ Additional Information',
					value: 'codeBlock(detailedDescription.extendedHelp)',
				});
			}
		}

		if (cmdMention) {
			embed.addFields({
				name: '🔗 Slash Command',
				value: `Use ${cmdMention}`,
				inline: true,
			});
		}

		return embed;
	}

	private async createDefaultHelpEmbed(
		commandRegistry: CommandRegistry,
		guildId: string | null,
		isSlashCommand: boolean,
	): Promise<EmbedBuilder> {
		const commands = this.container.stores.get('commands');
		const commandList = await Promise.all(
			commands.map(async (command) => {
				const cmdMention = await commandRegistry.getCommandMention({
					commandName: command.name,
					guildId: guildId,
				});
				return {
					name: command.name,
					description: command.description,
					mention: cmdMention,
				};
			}),
		);

		const appPrefix = this.container.client.options.defaultPrefix;
		const prefix = isSlashCommand ? '/' : appPrefix;
		const embed = new EmbedBuilder()
			.setColor(Colors.Blue)
			.setTitle('Available Commands')
			.setDescription(
				`Use \`${prefix}help <command>\` to get detailed information about a specific command.\n\n${commandList
					.map(
						(cmd) =>
							`${bold(`${cmd.mention || `/${cmd.name}`}`)}\n${cmd.description}`,
					)
					.join('\n\n')}`,
			)
			.setTimestamp();

		return embed;
	}
}
