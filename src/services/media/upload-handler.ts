/**
 * Sends upload to AWS
 * Creates media record
 */

import type { Prisma } from '@prisma/client';
import type { IS3ImageService } from '../../lib/s3/aws.js';
import type { ErrorHandler } from '../../utils/error-handler.js';
import type { AppLogger } from '../../utils/logger.js';
import type { IMediaService } from './media.service.js';

export interface IUploadHandler {
	handleUpload(file: File, data: Prisma.MediaCreateInput): Promise<string>;
}

export class UploadHandler implements IUploadHandler {
	constructor(
		private readonly mediaService: IMediaService,
		private readonly s3ImageService: IS3ImageService,
		private readonly logger: AppLogger,
		private readonly errorHandler: ErrorHandler,
	) {}

	/**
	 * Sanitizes the file name to be used in the database & AWS purposes
	 * Removes all special characters, spaces, except for periods in extensions
	 * @param fileName - The name of the file to sanitize
	 * @returns The sanitized file name
	 */
	sanitizeFileName(fileName: string) {
		return fileName.replace(/[^a-zA-Z0-9]/, '_');
	}

	/**
	 * Sanitizes the command name to be used for Discord command purposes
	 * Only ensures the command name is lowercase for consistency
	 * @param commandName - The name of the command to sanitize
	 * @returns The sanitized command name
	 */
	sanitizeCommandName(commandName: string) {
		return commandName.toLowerCase();
	}

	/**
	 * 1. Handles the upload of an image file to AWS S3
	 * 2. Creates a media record in the database
	 * @param file - The image file to upload
	 * @param data - The data for the media record
	 * @returns The uploaded URL of the image
	 * @throws {Error} - If the file is not an image or if the upload fails
	 *
	 * The name field will be used to call the image command
	 * The file name is used directly from what the passed in file is set to.
	 * @example
	 * ```
	 * const uploadedUrl = await uploadHandler.handleUpload(file, {
	 * 	name: 'test',
	 * 	guildId: '123',
	 * 	uploadedBy: '456',
	 * });
	 * ```
	 */

	async handleUpload(file: File, data: Prisma.MediaCreateInput) {
		const sanitizedName = this.sanitizeFileName(file.name);
		const sanitizedCommandName = this.sanitizeCommandName(data.name);

		try {
			// Create a new File with the sanitized name to ensure consistency
			const sanitizedFile = new File([file], sanitizedName, {
				type: file.type,
			}) as unknown as File;
			const uploadedUrl = await this.s3ImageService.uploadImage(sanitizedFile);
			await this.mediaService.createMediaRecord({
				name: sanitizedCommandName,
				guildId: data.guildId,
				fileKey: file.name,
				url: uploadedUrl,
				uploadedBy: data.uploadedBy,
				mimeType: file.type,
				fileSize: file.size,
			});
			this.logger.info(`Upload complete for ${sanitizedName}`);
			return uploadedUrl;
		} catch (error) {
			// Let ErrorHandler handle the error with appropriate context
			this.errorHandler.handleError(error, {
				fileName: sanitizedName,
				fileSize: file.size,
				mimeType: file.type,
				guildId: data.guildId,
				operation: 'upload',
			});
			throw error;
		}
	}
}
