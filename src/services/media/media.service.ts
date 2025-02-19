import type { Media } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { s3Config } from '../../lib/s3/config.js';
import type { AppLogger } from '../../utils/logger.js';
import type { MediaRepo as MediaRepository } from './media.repo.js';

/**
 * Interface for managing media records in the database
 */
export interface IMediaService {
	createMediaRecord(data: Prisma.MediaCreateInput): Promise<Media>;
	getMediaByName(name: string, guildId: string): Promise<Media | null>;
	listGuildMedia(guildId: string): Promise<Media[]>;
	deleteMediaRecord(id: string): Promise<void>;
}

/**
 * Service for managing media records in the database
 * Handles the business logic for media operations after S3 uploads
 */
export class MediaService implements IMediaService {
	private readonly imageBasePath: string;

	constructor(
		private readonly mediaRepo: MediaRepository,
		private readonly logger: AppLogger,
	) {
		this.imageBasePath = s3Config.imageBase;
	}

	/**
	 * Creates a new media record after successful S3 upload
	 * @param data The media data to create
	 * @returns The created media record
	 */
	public async createMediaRecord(
		data: Prisma.MediaCreateInput,
	): Promise<Media> {
		try {
			// Ensure fileKey is prefixed with imageBase path only once
			if (!data.fileKey.includes(this.imageBasePath)) {
				data.fileKey = `${this.imageBasePath}/${data.fileKey}`;
			}

			const media = await this.mediaRepo.create(data);
			this.logger.info(
				`Created media record for ${data.name} in guild ${data.guildId}`,
			);
			return media;
		} catch (error) {
			this.logger.error('Failed to create media record', error);
			throw error;
		}
	}

	/**
	 * Retrieves a media record by its unique name within a guild
	 * @param name The name of the media
	 * @param guildId The Discord guild ID
	 * @returns The media record if found, null otherwise
	 */
	public async getMediaByName(
		name: string,
		guildId: string,
	): Promise<Media | null> {
		return this.mediaRepo.findByName(name, guildId);
	}

	/**
	 * Lists all media records for a specific guild
	 * @param guildId The Discord guild ID
	 * @returns Array of media records
	 */
	public async listGuildMedia(guildId: string): Promise<Media[]> {
		return this.mediaRepo.findByGuild(guildId);
	}

	/**
	 * Deletes a media record
	 * Note: This only deletes the database record, not the S3 object
	 * @param id The ID of the media to delete
	 */
	public async deleteMediaRecord(id: string): Promise<void> {
		await this.mediaRepo.delete(id);
	}
}
