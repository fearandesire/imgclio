import type {
	ChatInputCommandSuccessPayload,
	Command,
	ContextMenuCommandSuccessPayload,
	MessageCommandSuccessPayload,
} from '@sapphire/framework';
import { container } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { cyan } from 'ansis';
import type { Guild, Message, User } from 'discord.js';
import { Colors, EmbedBuilder } from 'discord.js';
import _ from 'lodash';

export const RandomLoadingMessage = [
	'Loading unicorns...',
	'Finding the meaning of life...',
	'Counting sheep...',
	'Baking cookies...',
	'Summoning the magic...',
	'Chasing virtual butterflies...',
	'Reticulating splines...',
	'Consulting the oracle...',
	'Traveling through time...',
	'Training dragons...',
	'Deciphering ancient runes...',
	'Calibrating the flux capacitor...',
	'Composing a symphony...',
	'Assembling a team of superheroes...',
	'Building a spaceship...',
	'Warming up the hamsters...',
	'Inventing a new pizza topping...',
	'Making sure all ducks are in a row...',
	'Wrangling snakes on a plane...',
	'Brewing a perfect cup of coffee...',
	'Catching dreams...',
	'Charging the laser beams...',
	'Conducting a Martian orchestra...',
];

/**
 * Sends a loading message to the current channel
 * @param message The message data for which to send the loading message
 */
export function sendLoadingMessage(message: Message): Promise<typeof message> {
	return send(message, {
		embeds: [
			new EmbedBuilder()
				.setDescription(
					_.sample(RandomLoadingMessage) ?? 'doo-doo-doo... doo-doo-doo....',
				)
				.setColor(Colors.Blue),
		],
	});
}

export async function logSuccessCommand(
	payload:
		| ContextMenuCommandSuccessPayload
		| ChatInputCommandSuccessPayload
		| MessageCommandSuccessPayload,
) {
	let successLoggerData: ReturnType<typeof getSuccessLoggerData>;

	if ('interaction' in payload) {
		successLoggerData = getSuccessLoggerData(
			payload.interaction.guild,
			payload.interaction.user,
			payload.command,
		);
		await container.logger.info(
			`${payload.interaction.user} used cmd: \`/${payload.command.name}\``,
		);
	} else {
		successLoggerData = getSuccessLoggerData(
			payload.message.guild,
			payload.message.author,
			payload.command,
		);
	}
	container.logger.debug(
		`${successLoggerData.shard} - ${successLoggerData.commandName} ${successLoggerData.author} ${successLoggerData.sentAt}`,
	);
}

export function getSuccessLoggerData(
	guild: Guild | null,
	user: User,
	command: Command,
) {
	const shard = getShardInfo(guild?.shardId ?? 0);
	const commandName = getCommandInfo(command);
	const author = getAuthorInfo(user);
	const sentAt = getGuildInfo(guild);

	return { shard, commandName, author, sentAt };
}

function getShardInfo(id: number) {
	return `[${cyan(id.toString())}]`;
}

function getCommandInfo(command: Command) {
	return cyan(command.name);
}

function getAuthorInfo(author: User) {
	return `${author.username}[${cyan(author.id)}]`;
}

function getGuildInfo(guild: Guild | null) {
	if (guild === null) return 'Direct Messages';
	return `${guild.name}[${cyan(guild.id)}]`;
}
