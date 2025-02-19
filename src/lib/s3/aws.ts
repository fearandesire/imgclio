/**
 * Handle uploading images to AWS S3
 */

import type { BunFile, S3File } from 'bun';
import { s3Config } from './config.js';

/**
 * Maps file extensions to MIME types
 */
const MIME_TYPES = {
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
	gif: 'image/gif',
	webp: 'image/webp',
	svg: 'image/svg+xml',
} as const;

type ImageExtension = keyof typeof MIME_TYPES;

/**
 * Type that represents either a web File or a Bun File
 */
type UploadableFile = (File | BunFile) & {
	name: string;
};

/**
 * Interface for handling image operations with AWS S3
 */
export interface IS3ImageService {
	getCdnUrl(key: string): string;
	getMimeType(filename: string): string;
	getImageFile(imageName: string): Promise<S3File | null>;
	getImageUrl(imageName: string): Promise<string | null>;
	uploadImage(file: UploadableFile): Promise<string>;
	deleteImage(imageName: string): Promise<void>;
}

/**
 * Service for handling image operations with AWS S3
 * Uses Bun's native S3 client for AWS operations
 */
export class S3ImageService implements IS3ImageService {
	private readonly s3Client: typeof Bun.s3;
	private readonly CDN_URL: string;

	constructor(cdnUrl: string) {
		this.s3Client = Bun.s3;
		this.CDN_URL = cdnUrl;
	}

	getCdnUrl(key: string) {
		return `${this.CDN_URL}/${key}`;
	}

	/**
	 * Determines the MIME type from a filename
	 * @param filename - The name of the file
	 * @returns The MIME type for the file extension
	 * @throws Error if extension is not supported
	 */
	public getMimeType(filename: string): string {
		const extension = filename
			.split('.')
			.pop()
			?.toLowerCase() as ImageExtension;
		const mimeType = MIME_TYPES[extension];

		if (!mimeType) {
			throw new Error(`Unsupported image type: ${extension}`);
		}

		return mimeType;
	}

	/**
	 * Retrieves an image file from S3 if it exists
	 * @param imageName - The name of the image to retrieve
	 * @returns The S3File if it exists, null otherwise
	 * @throws Error if retrieval fails
	 */
	public async getImageFile(imageName: string): Promise<S3File | null> {
		try {
			const key = `${s3Config.imageBase}/${imageName}`;
			const imgFile = this.s3Client.file(key);

			const exists = await imgFile.exists();
			if (!exists) {
				return null;
			}

			return imgFile;
		} catch (error) {
			throw new Error(
				`Failed to retrieve image file: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}
	}

	/**
	 * Retrieves the CDN URL for an image if it exists in S3
	 * @param imageName - The name of the image to retrieve
	 * @returns The CDN URL if the image exists, null otherwise
	 * @throws Error if retrieval fails
	 */
	public async getImageUrl(imageName: string): Promise<string | null> {
		try {
			const key = `${s3Config.imageBase}/${imageName}`;
			const imgFile = this.s3Client.file(key);

			const exists = await imgFile.exists();
			if (!exists) {
				return null;
			}

			return this.getCdnUrl(key);
		} catch (error) {
			throw new Error(
				`Failed to retrieve image URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}
	}

	/**
	 * Uploads an image to S3
	 * @param file - The file to upload (can be either a web File or Bun File)
	 * @returns The URL of the uploaded image
	 * @throws Error if upload fails or image type is not supported
	 */
	public async uploadImage(file: UploadableFile): Promise<string> {
		try {
			const key = `${s3Config.imageBase}/${file.name}`;
			const mimeType = this.getMimeType(file.name);

			// Prepare upload with details
			const imgFile = this.s3Client.file(key, {
				type: mimeType,
			});

			// Write the file to the S3 bucket
			await imgFile.write(file);
			const returnString = `${this.CDN_URL}/${key}`;
			return returnString;
		} catch (error) {
			throw new Error(
				`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}
	}

	/**
	 * Deletes an image from S3
	 * @param imageName - The name of the image to delete
	 * @throws Error if deletion fails
	 */
	public async deleteImage(imageName: string): Promise<void> {
		try {
			const key = `${s3Config.imageBase}/${imageName}`;
			const imgFile = this.s3Client.file(key);
			const exists = await imgFile.exists();
			if (!exists) {
				throw new Error(`Image does not exist: ${imageName}`);
			}

			await imgFile.delete();
		} catch (error) {
			throw new Error(
				`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}
	}
}
