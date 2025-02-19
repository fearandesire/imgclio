import { CustomError } from '../../types/error.types.js';

export class FileValidationError extends CustomError {
	constructor(message: string) {
		super(message, 'FileValidationError');
		this.name = 'FileValidationError';
	}
}

export class FileSizeError extends FileValidationError {
	constructor(fileSize: number, maxSize: number) {
		super(
			`File size ${fileSize}MB exceeds maximum allowed size of ${maxSize}MB`,
		);
		this.name = 'FileSizeError';
	}
}

export class FileTypeError extends FileValidationError {
	constructor(mimeType: string) {
		super(`Invalid file type: ${mimeType}. Only media files are allowed.`);
		this.name = 'FileTypeError';
	}
}
