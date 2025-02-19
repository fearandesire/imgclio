import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import type { Args } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { type Client, Colors, EmbedBuilder, type Message } from 'discord.js';
import type { CustomClient } from '../lib/discord/client.js';
import { CommandRegistry } from '../services/discord/command-registry.js';
import {
	MediaSortOption,
	MediaViewer,
} from '../services/media/media-viewer.js';
import { MediaRepo } from '../services/media/media.repo.js';
import type { IMediaService } from '../services/media/media.service.js';
import { MediaService } from '../services/media/media.service.js';
import { Logger } from '../utils/logger.js';
@ApplyOptions<Command.Options>({
	description: 'View all available image commands in a nicely formatted list',
	name: 'listcommands',
	aliases: ['lc', 'commands'],
	fullCategory: ['Media'],
	detailedDescription: {
		usage: '$lc [sort:alphabetical|recent] [reverse:true|false]',
		examples: [
			'/listcommands sort:recent',
			'$lc',
			'$lc sort:recent',
			'$lc sort:alphabetical reverse:true',
		],
		extendedHelp:
			'Shows all available image commands for this server.\nDefault: Alphabetical\n' +
			'Sort Options:\n' +
			'• alphabetical (A-Z)\n' +
			'• recent (newest first)\n' +
			'• Add reverse:true to reverse the order',
	},
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(
			(builder) =>
				builder
					.setName(this.name)
					.setDescription(this.description)
					.addStringOption((option) =>
						option
							.setName('sort')
							.setDescription('How to sort the commands')
							.setRequired(false)
							.addChoices(
								{ name: 'Alphabetical', value: MediaSortOption.ALPHABETICAL },
								{ name: 'Recent', value: MediaSortOption.RECENT },
							),
					)
					.addBooleanOption((option) =>
						option
							.setName('reverse')
							.setDescription('Reverse the sort order')
							.setRequired(false),
					),
			{
				idHints: ['1341677677710676008'],
			},
		);
	}

	public override async chatInputRun(
		interaction: Command.ChatInputCommandInteraction,
	) {
		const guildId = interaction.guildId;

		if (!guildId) {
			return interaction.reply({
				content: 'This command can only be used in a server.',
				ephemeral: true,
			});
		}

		await interaction.deferReply();

		try {
			const sortBy =
				(interaction.options.getString('sort') as MediaSortOption) ||
				MediaSortOption.ALPHABETICAL;
			const reverse = interaction.options.getBoolean('reverse') || false;

			const embed = await this.createMediaListEmbed(
				guildId,
				{
					sortBy,
					reverse,
				},
				interaction.client,
			);
			return interaction.editReply({ embeds: [embed] });
		} catch (error) {
			this.container.logger.error('Failed to list commands:', error);
			return interaction.editReply({
				content:
					'An error occurred while fetching the command list. Please try again later.',
			});
		}
	}

	public override async messageRun(message: Message, args: Args) {
		const guildId = message.guildId;

		if (!guildId) {
			return send(message, 'This command can only be used in a server.');
		}

		try {
			const options = await this.parseMessageArgs(args);
			const embed = await this.createMediaListEmbed(
				guildId,
				options,
				message.client,
			);
			return send(message, { embeds: [embed] });
		} catch (error) {
			this.container.logger.error('Failed to list commands:', error);
			return send(
				message,
				'An error occurred while fetching the command list. Please try again later.',
			);
		}
	}

	private async parseMessageArgs(
		args: Args,
	): Promise<{ sortBy: MediaSortOption; reverse: boolean }> {
		const options = {
			sortBy: MediaSortOption.ALPHABETICAL,
			reverse: false,
		};

		while (true) {
			const arg = await args.pick('string').catch(() => null);
			if (!arg) break;

			const [key, value] = arg.split(':');

			if (key === 'sort') {
				if (value === 'recent') {
					options.sortBy = MediaSortOption.RECENT;
				} else if (value === 'alphabetical') {
					options.sortBy = MediaSortOption.ALPHABETICAL;
				}
			} else if (key === 'reverse') {
				options.reverse = value === 'true';
			}
		}

		return options;
	}

	private async createMediaListEmbed(
		guildId: string,
		options: { sortBy: MediaSortOption; reverse: boolean },
		client: CustomClient | Client,
	): Promise<EmbedBuilder> {
		const prisma = this.container.prisma;
		const mediaRepo = new MediaRepo(prisma);
		const mediaService: IMediaService = new MediaService(mediaRepo, Logger);
		const mediaViewer = new MediaViewer(mediaService, Logger);
		const media = await mediaViewer.getOrganizedGuildMedia(guildId, options);

		const embed = new EmbedBuilder()
			.setColor(Colors.Blue)
			.setTitle('Available Image Commands')
			.setTimestamp();

		const commandRegistry = new CommandRegistry(client);
		const makeCommandMention = await commandRegistry.getCommandMention({
			commandName: 'makecommand',
			guildId,
		});

		const makeCmdStr = ` Use ${makeCommandMention || '/makecommand'}`;

		if (!media || media.length === 0) {
			embed.setDescription(
				`No image commands have been created yet.${makeCmdStr} to create one.`,
			);
			return embed;
		}

		const sortDescription =
			options.sortBy === MediaSortOption.RECENT
				? 'recent first'
				: 'alphabetically';
		const orderDescription = options.reverse ? 'reversed' : 'ascending';

		embed.setDescription(
			`Found ${media.length} image command${media.length === 1 ? '' : 's'}\n` +
				`Sorted ${sortDescription} in ${orderDescription} order\n\n` +
				`${media.map((m) => `\`$${m.name}\``).join(', ')}\n\n` +
				`${makeCmdStr} to make more`,
		);

		embed.addFields(
			{
				name: 'Total Commands',
				value: media.length.toString(),
				inline: true,
			},
			{
				name: 'Sort Order',
				value: `${options.sortBy}${options.reverse ? ' (reversed)' : ''}`,
				inline: true,
			},
		);

		return embed;
	}
}
