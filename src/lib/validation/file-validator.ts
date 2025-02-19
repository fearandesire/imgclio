import { type } from 'arktype';
import { FileSizeError, FileTypeError } from './errors.js';

// Constants
const MAX_FILE_SIZE_MB = 50;

const ALLOWED_MIME_TYPES = {
	'image/jpeg': ['.jpg', '.jpeg'],
	'image/png': ['.png'],
	'image/gif': ['.gif'],
	'image/webp': ['.webp'],
	'image/svg+xml': ['.svg'],
} as const;

// Types
export type AllowedMimeType = keyof typeof ALLOWED_MIME_TYPES;

// ArkType validation types
export const FileMetadataType = type({
	size: 'number',
	mimeType: 'string',
	originalName: 'string',
});

export type FileMetadata = typeof FileMetadataType.infer;

/**
 * Handles file validation for media uploads
 * @class FileValidator
 */
export class FileValidator {
	private readonly maxSizeBytes: number;
	private readonly allowedMimeTypes: typeof ALLOWED_MIME_TYPES;

	constructor(
		maxSizeMB: number = MAX_FILE_SIZE_MB,
		allowedTypes: typeof ALLOWED_MIME_TYPES = ALLOWED_MIME_TYPES,
	) {
		this.maxSizeBytes = maxSizeMB * 1024 * 1024;
		this.allowedMimeTypes = allowedTypes;
	}

	/**
	 * Validates file size against maximum allowed size
	 * @param size - File size in bytes
	 * @throws {FileSizeError} If file size exceeds maximum allowed size
	 */
	public validateFileSize(size: number): void {
		if (size > this.maxSizeBytes) {
			throw new FileSizeError(
				Math.round(size / (1024 * 1024)),
				MAX_FILE_SIZE_MB,
			);
		}
	}

	/**
	 * Validates file MIME type against allowed types
	 * @param mimeType - File MIME type
	 * @throws {FileTypeError} If file type is not allowed
	 */
	public validateMimeType(mimeType: string): void {
		if (!Object.keys(this.allowedMimeTypes).includes(mimeType)) {
			throw new FileTypeError(mimeType);
		}
	}

	/**
	 * Validates file extension matches its MIME type
	 * @param fileName - Original file name
	 * @param mimeType - File MIME type
	 * @throws {FileTypeError} If extension doesn't match MIME type
	 */
	public validateFileExtension(fileName: string, mimeType: string): void {
		const extension = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));

		if (!this.isAllowedMimeType(mimeType)) {
			throw new FileTypeError(`Invalid MIME type: ${mimeType}`);
		}

		const allowedExtensions =
			this.allowedMimeTypes[mimeType as AllowedMimeType];
		const isValidExtension = allowedExtensions.some((ext) => ext === extension);

		if (!isValidExtension) {
			throw new FileTypeError(
				`File extension ${extension} does not match MIME type ${mimeType}`,
			);
		}
	}

	/**
	 * Checks if a MIME type is allowed
	 * @param mimeType - MIME type to check
	 * @returns boolean indicating if MIME type is allowed
	 */
	private isAllowedMimeType(mimeType: string): mimeType is AllowedMimeType {
		return Object.keys(this.allowedMimeTypes).includes(mimeType);
	}

	/**
	 * Performs all validation checks on a file
	 * @param metadata - File metadata containing size, MIME type, and name
	 * @throws {FileValidationError} If any validation fails
	 */
	public validateFile(metadata: FileMetadata): void {
		this.validateFileSize(metadata.size);
		this.validateMimeType(metadata.mimeType);
		this.validateFileExtension(metadata.originalName, metadata.mimeType);
	}

	/**
	 * Returns all allowed MIME types
	 * @returns Object containing allowed MIME types and their extensions
	 */
	public getAllowedMimeTypes(): typeof ALLOWED_MIME_TYPES {
		return this.allowedMimeTypes;
	}

	/**
	 * Returns maximum allowed file size in bytes
	 * @returns Maximum file size in bytes
	 */
	public getMaxFileSize(): number {
		return this.maxSizeBytes;
	}
}
