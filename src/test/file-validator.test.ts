import { beforeEach, describe, expect, test } from 'bun:test';
import { FileSizeError, FileTypeError } from '../lib/validation/errors.js';
import {
	type FileMetadata,
	FileValidator,
} from '../lib/validation/file-validator.js';

describe('FileValidator', () => {
	let validator: FileValidator;

	beforeEach(() => {
		validator = new FileValidator();
	});

	describe('validateFileSize', () => {
		test('should accept file size within limit', () => {
			const size = 5 * 1024 * 1024; // 5MB
			expect(() => validator.validateFileSize(size)).not.toThrow();
		});

		test('should throw FileSizeError when file exceeds limit', () => {
			const size = 51 * 1024 * 1024; // 51MB
			expect(() => validator.validateFileSize(size)).toThrow(FileSizeError);
		});
	});

	describe('validateMimeType', () => {
		test('should accept valid MIME types', () => {
			const validMimeTypes = [
				'image/jpeg',
				'image/png',
				'image/gif',
				'image/webp',
				'image/svg+xml',
			];

			for (const mimeType of validMimeTypes) {
				expect(() => validator.validateMimeType(mimeType)).not.toThrow();
			}
		});

		test('should throw FileTypeError for invalid MIME type', () => {
			const invalidMimeTypes = [
				'application/pdf',
				'text/plain',
				'image/tiff',
				'invalid-mime',
			];

			for (const mimeType of invalidMimeTypes) {
				expect(() => validator.validateMimeType(mimeType)).toThrow(
					FileTypeError,
				);
			}
		});
	});

	describe('validateFileExtension', () => {
		test('should accept valid file extensions for corresponding MIME types', () => {
			const validPairs = [
				{ fileName: 'test.jpg', mimeType: 'image/jpeg' },
				{ fileName: 'test.jpeg', mimeType: 'image/jpeg' },
				{ fileName: 'test.png', mimeType: 'image/png' },
				{ fileName: 'test.gif', mimeType: 'image/gif' },
				{ fileName: 'test.webp', mimeType: 'image/webp' },
				{ fileName: 'test.svg', mimeType: 'image/svg+xml' },
			];

			for (const pair of validPairs) {
				expect(() =>
					validator.validateFileExtension(pair.fileName, pair.mimeType),
				).not.toThrow();
			}
		});

		test('should throw FileTypeError for mismatched extension and MIME type', () => {
			const invalidPairs = [
				{ fileName: 'test.png', mimeType: 'image/jpeg' },
				{ fileName: 'test.jpg', mimeType: 'image/png' },
				{ fileName: 'test.gif', mimeType: 'image/webp' },
			];

			for (const pair of invalidPairs) {
				expect(() =>
					validator.validateFileExtension(pair.fileName, pair.mimeType),
				).toThrow(FileTypeError);
			}
		});

		test('should throw FileTypeError for invalid MIME type', () => {
			expect(() =>
				validator.validateFileExtension('test.jpg', 'invalid/mime'),
			).toThrow(FileTypeError);
		});
	});

	describe('validateFile', () => {
		test('should accept valid file metadata', () => {
			const validMetadata: FileMetadata = {
				size: 1024 * 1024, // 1MB
				mimeType: 'image/jpeg',
				originalName: 'test.jpg',
			};

			expect(() => validator.validateFile(validMetadata)).not.toThrow();
		});

		test('should throw FileSizeError for oversized file', () => {
			const oversizedMetadata: FileMetadata = {
				size: 51 * 1024 * 1024, // 51MB
				mimeType: 'image/jpeg',
				originalName: 'test.jpg',
			};

			expect(() => validator.validateFile(oversizedMetadata)).toThrow(
				FileSizeError,
			);
		});

		test('should throw FileTypeError for invalid MIME type', () => {
			const invalidMimeMetadata: FileMetadata = {
				size: 1024 * 1024,
				mimeType: 'application/pdf',
				originalName: 'test.pdf',
			};

			expect(() => validator.validateFile(invalidMimeMetadata)).toThrow(
				FileTypeError,
			);
		});

		test('should throw FileTypeError for mismatched extension', () => {
			const mismatchedExtMetadata: FileMetadata = {
				size: 1024 * 1024,
				mimeType: 'image/jpeg',
				originalName: 'test.png',
			};

			expect(() => validator.validateFile(mismatchedExtMetadata)).toThrow(
				FileTypeError,
			);
		});
	});

	describe('utility methods', () => {
		test('should return correct max file size', () => {
			const expectedBytes = 50 * 1024 * 1024; // 50MB
			expect(validator.getMaxFileSize()).toBe(expectedBytes);
		});

		test('should return allowed MIME types', () => {
			const mimeTypes = validator.getAllowedMimeTypes();
			expect(Object.keys(mimeTypes)).toContain('image/jpeg');
			expect(Object.keys(mimeTypes)).toContain('image/png');
			expect(Object.keys(mimeTypes)).toContain('image/gif');
			expect(Object.keys(mimeTypes)).toContain('image/webp');
			expect(Object.keys(mimeTypes)).toContain('image/svg+xml');
		});
	});

	describe('custom configuration', () => {
		test('should accept custom max file size', () => {
			const customValidator = new FileValidator(10); // 10MB limit
			const size = 9 * 1024 * 1024; // 9MB
			expect(() => customValidator.validateFileSize(size)).not.toThrow();
			expect(() => customValidator.validateFileSize(11 * 1024 * 1024)).toThrow(
				FileSizeError,
			);
		});

		test('should accept custom allowed MIME types', () => {
			const customMimeTypes = {
				'image/jpeg': ['.jpg', '.jpeg'] as const,
				'image/png': ['.png'] as const,
				'image/gif': ['.gif'] as const,
				'image/webp': ['.webp'] as const,
				'image/svg+xml': ['.svg'] as const,
			} as const;
			const customValidator = new FileValidator(50, customMimeTypes);

			expect(() =>
				customValidator.validateMimeType('image/jpeg'),
			).not.toThrow();
			expect(() => customValidator.validateMimeType('image/png')).not.toThrow();
			expect(() => customValidator.validateMimeType('text/plain')).toThrow(
				FileTypeError,
			);
		});
	});
});
