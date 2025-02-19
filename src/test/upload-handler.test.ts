import { beforeEach, describe, expect, mock, test } from 'bun:test';
import type { S3ImageService } from '../lib/s3/aws.js';
import type { MediaService } from '../services/media/media.service.js';
import { UploadHandler } from '../services/media/upload-handler.js';
import type { ErrorHandler } from '../utils/error-handler.js';
import type { AppLogger } from '../utils/logger.js';

describe('UploadHandler', () => {
	// Mock dependencies
	const mockLogger = {
		info: mock(() => {}),
		error: mock(() => {}),
	} as unknown as AppLogger;

	const mockErrorHandler = {
		handleError: mock(() => {}),
		handleFatalError: mock(() => {}),
		handleOperationalError: mock(() => {}),
		handleValidationError: mock(() => {}),
		logger: mockLogger,
		normalizeError: mock((error: unknown) => ({
			message: error instanceof Error ? error.message : 'Unknown error',
			name: error instanceof Error ? error.name : 'Error',
		})),
	} as unknown as ErrorHandler;

	const mockMediaService = {
		createMediaRecord: mock(() =>
			Promise.resolve({
				id: '1',
				name: 'test',
				guildId: '123',
				uploadedBy: '456',
				url: 'https://example.com/test.jpg',
				fileKey: 'test.jpg',
				mimeType: 'image/jpeg',
				fileSize: 4,
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		),
	} as unknown as MediaService;

	const mockS3ImageService = {
		uploadImage: mock(() => Promise.resolve('https://example.com/test.jpg')),
	} as unknown as S3ImageService;

	let uploadHandler: UploadHandler;

	beforeEach(() => {
		// Reset all mocks before each test
		mockMediaService.createMediaRecord = mock(() =>
			Promise.resolve({
				id: '1',
				name: 'test',
				guildId: '123',
				uploadedBy: '456',
				url: 'https://example.com/test.jpg',
				fileKey: 'test.jpg',
				mimeType: 'image/jpeg',
				fileSize: 4,
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		);
		mockS3ImageService.uploadImage = mock(() =>
			Promise.resolve('https://example.com/test.jpg'),
		);
		mockErrorHandler.handleError = mock(() => {});

		uploadHandler = new UploadHandler(
			mockMediaService,
			mockS3ImageService,
			mockLogger,
			mockErrorHandler,
		);
	});

	describe('handleUpload', () => {
		test('should successfully upload file and create media record', async () => {
			// Arrange
			const mockFile = new Blob(['test'], {
				type: 'image/jpeg',
			}) as unknown as File;
			Object.defineProperty(mockFile, 'name', { value: 'test.jpg' });
			const mockData = {
				name: 'test',
				guildId: '123',
				uploadedBy: '456',
				url: 'https://example.com/test.jpg',
				fileKey: 'test.jpg',
				mimeType: 'image/jpeg',
				fileSize: mockFile.size,
			};

			// Act
			const result = await uploadHandler.handleUpload(mockFile, mockData);

			// Assert
			expect(result).toBe('https://example.com/test.jpg');
			expect(mockS3ImageService.uploadImage).toHaveBeenCalledWith(
				expect.any(File),
			);
			expect(mockMediaService.createMediaRecord).toHaveBeenCalledWith({
				name: mockData.name.toLowerCase(),
				guildId: mockData.guildId,
				fileKey: mockFile.name,
				url: 'https://example.com/test.jpg',
				uploadedBy: mockData.uploadedBy,
				mimeType: mockFile.type,
				fileSize: mockFile.size,
			});
		});

		test('should handle upload failure', async () => {
			// Arrange
			const mockFile = new Blob(['test'], {
				type: 'image/jpeg',
			}) as unknown as File;
			Object.defineProperty(mockFile, 'name', { value: 'test.jpg' });
			const mockData = {
				name: 'test',
				guildId: '123',
				uploadedBy: '456',
				url: 'https://example.com/test.jpg',
				fileKey: 'test.jpg',
				mimeType: 'image/jpeg',
				fileSize: mockFile.size,
			};
			const mockError = new Error('Upload failed');
			mockS3ImageService.uploadImage = mock(() => Promise.reject(mockError));

			// Act & Assert
			await expect(
				uploadHandler.handleUpload(mockFile, mockData),
			).rejects.toThrow('Upload failed');
			expect(mockMediaService.createMediaRecord).not.toHaveBeenCalled();
			expect(mockErrorHandler.handleError).toHaveBeenCalledWith(mockError, {
				fileName: mockFile.name.replace(/[^a-zA-Z0-9]/, '_'),
				fileSize: mockFile.size,
				mimeType: mockFile.type,
				guildId: mockData.guildId,
				operation: 'upload',
			});
		});

		test('should handle media record creation failure', async () => {
			// Arrange
			const mockFile = new Blob(['test'], {
				type: 'image/jpeg',
			}) as unknown as File;
			Object.defineProperty(mockFile, 'name', { value: 'test.jpg' });
			const mockData = {
				name: 'test',
				guildId: '123',
				uploadedBy: '456',
				url: 'https://example.com/test.jpg',
				fileKey: 'test.jpg',
				mimeType: 'image/jpeg',
				fileSize: mockFile.size,
			};
			const mockError = new Error('Database error');

			mockS3ImageService.uploadImage = mock(() =>
				Promise.resolve('https://example.com/test.jpg'),
			);
			mockMediaService.createMediaRecord = mock(() =>
				Promise.reject(mockError),
			);

			// Act & Assert
			await expect(
				uploadHandler.handleUpload(mockFile, mockData),
			).rejects.toThrow('Database error');
			expect(mockS3ImageService.uploadImage).toHaveBeenCalled();
			expect(mockErrorHandler.handleError).toHaveBeenCalledWith(mockError, {
				fileName: mockFile.name.replace(/[^a-zA-Z0-9]/, '_'),
				fileSize: mockFile.size,
				mimeType: mockFile.type,
				guildId: mockData.guildId,
				operation: 'upload',
			});
		});

		test('should sanitize file name and command name', async () => {
			// Arrange
			const mockFile = new Blob(['test'], {
				type: 'image/jpeg',
			}) as unknown as File;
			Object.defineProperty(mockFile, 'name', { value: 'test@file.jpg' });
			const mockData = {
				name: 'Test Command',
				guildId: '123',
				uploadedBy: '456',
				url: 'https://example.com/test.jpg',
				fileKey: 'test@file.jpg',
				mimeType: 'image/jpeg',
				fileSize: mockFile.size,
			};

			// Act
			await uploadHandler.handleUpload(mockFile, mockData);

			// Assert
			expect(mockS3ImageService.uploadImage).toHaveBeenCalledWith(
				expect.objectContaining({
					name: 'test_file.jpg',
				}),
			);
			expect(mockMediaService.createMediaRecord).toHaveBeenCalledWith(
				expect.objectContaining({
					name: 'test command',
					fileKey: 'test@file.jpg',
				}),
			);
		});
	});
});
