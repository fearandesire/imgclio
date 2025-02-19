import type { Events } from '@sapphire/framework';
import { Listener } from '@sapphire/framework';
import { ChannelType, type Message } from 'discord.js';

export class UserEvent extends Listener<typeof Events.MentionPrefixOnly> {
	public override async run(message: Message) {
		const prefix = this.container.client.options.defaultPrefix;
		const noPrefixMsg = 'Not configured to use a prefix in this guild.';
		if (
			message.channel.type === ChannelType.DM ||
			message.channel.type === ChannelType.GroupDM
		) {
			return message.reply(
				prefix ? `My prefix in this guild is: \`${prefix}\`` : noPrefixMsg,
			);
		}
		return message.channel.send(
			prefix ? `My prefix in this guild is: \`${prefix}\`` : noPrefixMsg,
		);
	}
}
