import type { Media } from '@prisma/client';
import type { AppLogger } from '../../utils/logger.js';
import type { IMediaService } from './media.service.js';

export enum MediaSortOption {
	ALPHABETICAL = 'alphabetical',
	RECENT = 'recent',
}

export interface MediaViewOptions {
	sortBy?: MediaSortOption;
	reverse?: boolean;
}

/**
 * Domain service for organizing and viewing media records
 * Provides sorting and organization capabilities for guild media
 */
export class MediaViewer {
	constructor(
		private readonly mediaService: IMediaService,
		private readonly logger: AppLogger,
	) {}

	/**
	 * Retrieves and organizes media for a specific guild
	 * @param guildId The Discord guild ID
	 * @param options Sorting and organization options
	 * @returns Sorted array of media records
	 */
	public async getOrganizedGuildMedia(
		guildId: string,
		options: MediaViewOptions = {},
	): Promise<Media[] | null> {
		try {
			const media = await this.mediaService.listGuildMedia(guildId);
			if (!media) {
				return null;
			}
			return this.sortMedia(media, options);
		} catch (error) {
			this.logger.error('Failed to retrieve organized guild media', error);
			throw error;
		}
	}

	/**
	 * Sorts media records based on provided options
	 * Defaults to alphabetical sorting if no options are provided
	 * @param media Array of media records to sort
	 * @param options Sorting options
	 * @returns Sorted array of media records
	 */
	private sortMedia(media: Media[], options: MediaViewOptions): Media[] {
		const { sortBy = MediaSortOption.ALPHABETICAL, reverse = false } = options;

		const sortedMedia = [...media];

		switch (sortBy) {
			case MediaSortOption.ALPHABETICAL:
				sortedMedia.sort((a, b) => a.name.localeCompare(b.name));
				break;
			case MediaSortOption.RECENT:
				sortedMedia.sort(
					(a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
				);
				break;
		}

		return reverse ? sortedMedia.reverse() : sortedMedia;
	}
}

// Export type for mocking in tests
export type IMediaViewer = MediaViewer;
