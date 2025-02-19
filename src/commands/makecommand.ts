import type { Prisma } from '@prisma/client';
import { ApplyOptions } from '@sapphire/decorators';
import { isMediaAttachment } from '@sapphire/discord.js-utilities';
import { Command } from '@sapphire/framework';
import type { Args } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { Colors, EmbedBuilder, type Message } from 'discord.js';
import { CDN_URL } from '../lib/env.js';
import type { IS3ImageService } from '../lib/s3/aws.js';
import { S3ImageService } from '../lib/s3/aws.js';
import { FileSizeError, FileTypeError } from '../lib/validation/errors.js';
import { FileValidator } from '../lib/validation/file-validator.js';
import { MediaRepo } from '../services/media/media.repo.js';
import type { IMediaService } from '../services/media/media.service.js';
import { MediaService } from '../services/media/media.service.js';
import { UploadHandler } from '../services/media/upload-handler.js';
import { ErrorHandler } from '../utils/error-handler.js';
import { Logger } from '../utils/logger.js';

interface ProcessMediaOptions {
	name: string; // The name of the command to create
	guildId: string; // The guild ID to create the command in
	uploadedBy: string; // The user ID of the user who uploaded the media
	inputSource: string; // The source of the media to upload
	fileName: string | undefined; // The name of the file to upload
	contentType: string | null | undefined; // The content type of the media
}

@ApplyOptions<Command.Options>({
	description: 'Create a new image command from an attachment or link',
	name: 'makecommand',
	aliases: ['mc'],
	fullCategory: ['Media'],
	detailedDescription: {
		usage: '$mc <command_name> [image_link or attach an image]',
		examples: [
			'/makecommand cute <attached image, or link>',
			'$mc funny https://example.com/image.png',
			'$mc meme',
		],
		extendedHelp:
			'You can provide the image either by attaching it directly to your message or by providing a link. At least one of these (attachment or link) is required. If both are provided, the attached image will be used instead of the link.',
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
						.setName('name')
						.setDescription('The name of the command to create')
						.setRequired(true),
				)
				.addAttachmentOption((option) =>
					option
						.setName('attachment')
						.setDescription('The attachment to process')
						.setRequired(false),
				)
				.addStringOption((option) =>
					option
						.setName('link')
						.setDescription('The link to process')
						.setRequired(false),
				),
		);
	}

	public override async chatInputRun(
		interaction: Command.ChatInputCommandInteraction,
	) {
		const attachment = interaction.options.getAttachment('attachment');
		const link = interaction.options.getString('link');
		const name = interaction.options.getString('name', true);
		const guildId = interaction.guildId;

		if (!guildId) {
			return interaction.reply({
				content: 'This command can only be used in a server.',
				ephemeral: true,
			});
		}

		// Validate inputs
		if (!attachment && !link) {
			return interaction.reply({
				content: 'You must provide either an attachment or a link.',
				ephemeral: true,
			});
		}

		if (attachment && !isMediaAttachment(attachment)) {
			return interaction.reply({
				content: 'The provided attachment is not a valid media file.',
				ephemeral: true,
			});
		}

		await interaction.deferReply();

		try {
			const inputSource = attachment?.url || link;
			if (!inputSource) {
				return interaction.editReply({
					content: 'No valid input source provided.',
				});
			}

			this.container.logger.debug(inputSource);

			const result = await this.processMediaUpload({
				name,
				guildId,
				uploadedBy: interaction.user.id,
				inputSource,
				fileName: attachment?.name,
				contentType: attachment?.contentType,
			});

			return interaction.editReply({ embeds: [result] });
		} catch (error) {
			this.container.logger.error('Error creating command:', error);
			return interaction.editReply({
				content: this.formatErrorMessage(error),
			});
		}
	}

	public override async messageRun(message: Message, args: Args) {
		try {
			const name = await args.pick('string');
			const guildId = message.guildId;

			if (!guildId) {
				return send(message, 'This command can only be used in a server.');
			}

			// Try to get attachment first
			const attachment = message.attachments.first();
			let inputSource: string | undefined;

			// If attachment exists, validate it
			if (attachment) {
				if (!isMediaAttachment(attachment)) {
					return send(
						message,
						'The provided attachment is not a valid media file.',
					);
				}
				inputSource = attachment.url;
			} else {
				// If no attachment, try to get link from args
				try {
					inputSource = await args.pick('string');
					if (!inputSource) {
						return send(
							message,
							'You must provide either an attachment or a link.',
						);
					}
				} catch (error) {
					return send(
						message,
						'You must provide either an attachment or a link.',
					);
				}
			}

			const result = await this.processMediaUpload({
				name,
				guildId,
				uploadedBy: message.author.id,
				inputSource,
				fileName: attachment?.name,
				contentType: attachment?.contentType,
			});

			return send(message, { embeds: [result] });
		} catch (error) {
			return send(message, this.formatErrorMessage(error));
		}
	}

	/**
	 * Processes media upload and creates a command
	 * @param options - Options for processing media
	 * @returns EmbedBuilder with success message
	 * @throws {FileSizeError} If file size exceeds maximum
	 * @throws {FileTypeError} If file type is invalid
	 */
	private async processMediaUpload(
		options: ProcessMediaOptions,
	): Promise<EmbedBuilder> {
		this.container.logger.debug('Starting media upload process');
		const response = await fetch(options.inputSource);
		this.container.logger.debug(`Fetch response status: ${response.status}`);
		this.container.logger.debug(
			`Response headers: ${JSON.stringify(Object.fromEntries(response.headers))}`,
		);

		// Check if response is ok
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		// Log response body details
		const arrayBuffer = await response.arrayBuffer();
		this.container.logger.debug(
			`Response array buffer size: ${arrayBuffer.byteLength}`,
		);

		// Create Blob using Buffer in Node.js
		const buffer = Buffer.from(arrayBuffer);
		const blob = new Blob([buffer], {
			type: response.headers.get('content-type') || 'image/png',
		});

		this.container.logger.debug({
			blobSize: blob.size,
			blobType: blob.type,
			bufferLength: buffer.length,
		});

		// Generate a unique filename if none provided
		const uniqueId = Math.floor(100000 + Math.random() * 900000); // 6 digit number
		const fileExtension = options.fileName?.split('.').pop() ?? 'png';
		const fileName =
			options.fileName ?? `${options.name}-${uniqueId}.${fileExtension}`;

		const contentType =
			options.contentType ??
			response.headers.get('content-type') ??
			'image/png';

		// Create a File object with proper name and type
		const file = new File([blob], fileName, { type: contentType });
		const metadata = {
			size: file.size,
			mimeType: contentType,
			originalName: fileName,
		};

		const fileValidator = new FileValidator();
		// Validate file
		fileValidator.validateFile(metadata);

		// Create media input data
		const sanitizedName = fileName.replace(/[^a-zA-Z0-9-]/g, '-');
		const mediaData: Prisma.MediaCreateInput = {
			name: options.name,
			guildId: options.guildId,
			uploadedBy: options.uploadedBy,
			url: options.inputSource,
			fileKey: sanitizedName,
			mimeType: contentType,
			fileSize: file.size,
		};

		// Upload file
		const prisma = this.container.prisma;
		const mediaRepo = new MediaRepo(prisma);
		const mediaService: IMediaService = new MediaService(mediaRepo, Logger);
		const s3ImageService: IS3ImageService = new S3ImageService(CDN_URL);
		const errorHandler = new ErrorHandler(Logger);
		const uploadHandler = new UploadHandler(
			mediaService,
			s3ImageService,
			Logger,
			errorHandler,
		);
		const uploadedUrl = await uploadHandler.handleUpload(
			file as unknown as File,
			mediaData,
		);

		// Create success embed
		return new EmbedBuilder()
			.setColor(Colors.LuminousVividPink)
			.setTitle('Command Created Successfully!')
			.setDescription(
				`Your command has been created! You can use it with \`$${options.name}\``,
			)
			.addFields(
				{ name: 'Command Name', value: options.name, inline: true },
				{ name: 'Usage', value: `\`$${options.name}\``, inline: true },
			)
			.setImage(uploadedUrl)
			.setTimestamp();
	}

	/**
	 * Formats error messages for user display
	 * @param error - The error to format
	 * @returns Formatted error message
	 */
	private formatErrorMessage(error: unknown): string {
		let errorMessage =
			'An unexpected error occurred while processing your command.';

		if (error instanceof FileSizeError) {
			// @ts-expect-error - Error type is incorrect
			errorMessage = `File size too large. Maximum size is ${Math.round(error.maxSize / (1024 * 1024))}MB.`;
		} else if (error instanceof FileTypeError) {
			errorMessage = `Invalid file type. ${error.message}`;
		}

		return errorMessage;
	}
}
