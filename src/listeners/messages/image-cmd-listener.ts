import { ApplyOptions } from '@sapphire/decorators';
import { isTextBasedChannel } from '@sapphire/discord.js-utilities';
import { Events, Listener } from '@sapphire/framework';
import { EmbedBuilder, type Message } from 'discord.js';
import { MediaRepo } from '../../services/media/media.repo.js';
import type { IMediaService } from '../../services/media/media.service.js';
import { MediaService } from '../../services/media/media.service.js';
import { Logger } from '../../utils/logger.js';
@ApplyOptions<Listener.Options>({
	event: Events.MessageCreate,
})
export class ImageCommandListener extends Listener {
	public override async run(message: Message) {
		// Ignore messages from bots
		if (message.author.bot) return;

		// Get the client's prefix
		const prefix = this.container.client.options.defaultPrefix as string;
		if (!prefix) return;

		// Check if message starts with prefix
		if (!message.content.startsWith(prefix)) return;

		// Get the command name (everything after the prefix)
		const commandName = message.content.slice(prefix.length).trim();
		if (!commandName) return;

		// Get guild ID
		const guildId = message.guildId;
		if (!guildId) return;

		// Check if channel is text-based
		if (!isTextBasedChannel(message.channel)) return;
		const channel = message.channel;

		this.container.logger.info(`Processing image command: ${commandName}`);
		try {
			// Initialize services
			const mediaRepo = new MediaRepo(this.container.prisma);
			const mediaService: IMediaService = new MediaService(mediaRepo, Logger);

			// Try to find media by command name
			const media = await mediaService.getMediaByName(commandName, guildId);

			// If media exists, send it
			if (media) {
				const embed = new EmbedBuilder().setImage(media.url);
				await channel.send({ embeds: [embed] });
			}
			// If media doesn't exist, silently ignore
		} catch (error) {
			// Log error but don't send to channel
			this.container.logger.error('Error processing image command:', error);
		}
	}
}
