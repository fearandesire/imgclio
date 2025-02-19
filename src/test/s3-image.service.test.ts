import { beforeEach, describe, expect, mock, test } from 'bun:test';
import type { BunFile } from 'bun';
import { S3ImageService } from '../lib/s3/aws.js';
import { s3Config } from '../lib/s3/config.js';

// Test constants
const TEST_CDN_URL = 'https://test-cdn.example.com';

// Mock factories
const createMockS3Operations = (overrides = {}) => ({
	exists: mock(() => Promise.resolve(false)),
	write: mock(() => Promise.resolve(undefined)),
	delete: mock(() => Promise.resolve(undefined)),
	...overrides,
});

const createMockFile = (
	name: string,
	type: string,
): BunFile & { name: string } => {
	const blob = new Blob(['test'], { type });
	return Object.assign(blob, { name }) as BunFile & { name: string };
};

// Mock Bun.s3 setup
const mockFile = mock(() => createMockS3Operations());

// Type assertion for Bun.s3 mock
Object.assign(Bun, {
	s3: { file: mockFile as unknown as (path: string, options?: any) => any },
});

describe('S3ImageService', () => {
	let s3ImageService: S3ImageService;

	beforeEach(() => {
		s3ImageService = new S3ImageService(TEST_CDN_URL);
		mockFile.mockClear();
	});

	describe('getCdnUrl', () => {
		test('CDN URL is dynamically constructed correctly', () => {
			const key = 'test-image.jpg';
			const url = s3ImageService.getCdnUrl(key);
			expect(url).toBe(`${TEST_CDN_URL}/${key}`);
		});
	});

	describe('getImageUrl', () => {
		const testCases = [
			{
				name: 'should return null when image does not exist',
				exists: false,
				imageName: 'non-existent.jpg',
				expectedResult: null,
			},
			{
				name: 'should return CDN URL when image exists',
				exists: true,
				imageName: 'existing.jpg',
				expectedResult: `${TEST_CDN_URL}/${s3Config.imageBase}/existing.jpg`,
			},
		];

		for (const { name, exists, imageName, expectedResult } of testCases) {
			test(name, async () => {
				mockFile.mockImplementation(() =>
					createMockS3Operations({
						exists: mock(() => Promise.resolve(exists)),
					}),
				);

				const result = await s3ImageService.getImageUrl(imageName);
				expect(result).toBe(expectedResult);
				expect(mockFile).toHaveBeenCalledWith(
					`${s3Config.imageBase}/${imageName}`,
				);
			});
		}

		test('should throw error when URL retrieval fails', async () => {
			mockFile.mockImplementation(() =>
				createMockS3Operations({
					exists: mock(() => Promise.reject(new Error('S3 Error'))),
				}),
			);

			await expect(s3ImageService.getImageUrl('error.jpg')).rejects.toThrow(
				'Failed to retrieve image URL',
			);
		});
	});

	describe('getImageFile', () => {
		const testCases = [
			{
				name: 'should return null when image does not exist',
				exists: false,
				imageName: 'non-existent.jpg',
				expectedResult: null,
			},
			{
				name: 'should return S3File object when image exists',
				exists: true,
				imageName: 'existing.jpg',
				expectedResult: 'defined',
			},
		];

		for (const { name, exists, imageName, expectedResult } of testCases) {
			test(name, async () => {
				const mockS3Operations = createMockS3Operations({
					exists: mock(() => Promise.resolve(exists)),
				});
				mockFile.mockImplementation(() => mockS3Operations);

				const result = await s3ImageService.getImageFile(imageName);

				if (expectedResult === 'defined') {
					expect(result).toBeDefined();
				} else {
					expect(result).toBeNull();
				}

				expect(mockFile).toHaveBeenCalledWith(
					`${s3Config.imageBase}/${imageName}`,
				);
			});
		}

		test('should throw error when file retrieval fails', async () => {
			mockFile.mockImplementation(() =>
				createMockS3Operations({
					exists: mock(() => Promise.reject(new Error('S3 Error'))),
				}),
			);

			await expect(s3ImageService.getImageFile('error.jpg')).rejects.toThrow(
				'Failed to retrieve image file',
			);
		});
	});

	describe('uploadImage', () => {
		test('successfully uploads image and returns CDN URL', async () => {
			mockFile.mockImplementation(() => createMockS3Operations());

			const file = createMockFile('test.jpg', 'image/jpeg');
			const result = await s3ImageService.uploadImage(file);

			expect(result).toBe(`${TEST_CDN_URL}/${s3Config.imageBase}/test.jpg`);
			expect(mockFile).toHaveBeenCalledWith(`${s3Config.imageBase}/test.jpg`, {
				type: 'image/jpeg',
			});
		});

		test('throws error for unsupported image type', async () => {
			const file = createMockFile('test.txt', 'text/plain');
			await expect(s3ImageService.uploadImage(file)).rejects.toThrow(
				'Unsupported image type',
			);
		});

		test('throws error when upload fails', async () => {
			mockFile.mockImplementation(() =>
				createMockS3Operations({
					write: mock(() => Promise.reject(new Error('Upload failed'))),
				}),
			);

			const file = createMockFile('test.jpg', 'image/jpeg');
			await expect(s3ImageService.uploadImage(file)).rejects.toThrow(
				'Failed to upload image',
			);
		});
	});

	describe('MIME type handling', () => {
		const mimeTypeTestCases = [
			{ filename: 'test.jpg', expected: 'image/jpeg' },
			{ filename: 'test.jpeg', expected: 'image/jpeg' },
			{ filename: 'test.png', expected: 'image/png' },
			{ filename: 'test.gif', expected: 'image/gif' },
			{ filename: 'test.webp', expected: 'image/webp' },
			{ filename: 'test.svg', expected: 'image/svg+xml' },
		];

		for (const { filename, expected } of mimeTypeTestCases) {
			test(`handles ${filename.split('.').pop()} files correctly`, async () => {
				mockFile.mockImplementation(() => createMockS3Operations());

				const file = createMockFile(filename, expected);
				await s3ImageService.uploadImage(file);

				expect(mockFile).toHaveBeenCalledWith(
					`${s3Config.imageBase}/${filename}`,
					{ type: expected },
				);
			});
		}
	});

	describe('deleteImage', () => {
		test('successfully deletes image', async () => {
			mockFile.mockImplementation(() =>
				createMockS3Operations({
					exists: mock(() => Promise.resolve(true)),
					delete: mock(() => Promise.resolve(undefined)),
				}),
			);

			await s3ImageService.deleteImage('test.jpg');
		});

		test('throws error when image does not exist', async () => {
			mockFile.mockImplementation(() =>
				createMockS3Operations({
					exists: mock(() => Promise.resolve(false)),
				}),
			);

			await expect(
				s3ImageService.deleteImage('non-existent.jpg'),
			).rejects.toThrow('Image does not exist');
		});

		test('throws error when deletion fails', async () => {
			mockFile.mockImplementation(() =>
				createMockS3Operations({
					exists: mock(() => Promise.resolve(true)),
					delete: mock(() => Promise.reject(new Error('Deletion failed'))),
				}),
			);

			await expect(s3ImageService.deleteImage('test.jpg')).rejects.toThrow(
				'Failed to delete image',
			);
		});
	});
});
