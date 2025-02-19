import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	test,
} from 'bun:test';
import { Prisma, PrismaClient } from '@prisma/client';
import { MediaRepo } from '../../services/media/media.repo.js';
import { MediaService } from '../../services/media/media.service.js';
import type { AppLogger } from '../../utils/logger.js';

describe('MediaService Integration Tests', () => {
	let prisma: PrismaClient;
	let mediaService: MediaService;
	let mediaRepo: MediaRepo;
	let logger: AppLogger;

	// Test data
	const testGuildId = 'test-guild-123';
	const testMedia = {
		name: 'test-image',
		url: 'https://example.com/test-image.jpg',
		uploadedBy: 'user-123',
		guildId: testGuildId,
		fileKey: 'test-image.jpg',
		mimeType: 'image/jpeg',
		fileSize: 1024,
	};

	beforeAll(async () => {
		prisma = new PrismaClient();
		logger = {
			info: (message: string) => console.log(message),
			error: (message: string, error?: unknown) =>
				console.error(message, error),
			debug: (message: string) => console.debug(message),
			warn: (message: string) => console.warn(message),
		} as AppLogger;
		mediaRepo = new MediaRepo(prisma);
		mediaService = new MediaService(mediaRepo, logger);
	});

	beforeEach(async () => {
		// Clean up the test data before each test
		await prisma.media.deleteMany({
			where: { guildId: testGuildId },
		});
	});

	afterAll(async () => {
		await prisma.$disconnect();
	});

	describe('createMediaRecord', () => {
		test('should create media record with correct image base path', async () => {
			const media = await mediaService.createMediaRecord(testMedia);

			expect(media).toBeDefined();
			expect(media.name).toBe(testMedia.name);
			expect(media.fileKey.startsWith('images/')).toBe(true);
			expect(media.fileKey).toContain(testMedia.fileKey);
		});

		test('should not modify fileKey if it already has image base path', async () => {
			const mediaWithBasePath = {
				...testMedia,
				fileKey: 'images/already-prefixed.jpg',
			};

			const media = await mediaService.createMediaRecord(mediaWithBasePath);
			expect(media.fileKey).toBe(mediaWithBasePath.fileKey);
		});

		test('should handle duplicate media name error', async () => {
			await mediaService.createMediaRecord(testMedia);

			try {
				await mediaService.createMediaRecord(testMedia);
				throw new Error('Should have thrown an error');
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect(error instanceof Prisma.PrismaClientKnownRequestError).toBe(
					true,
				);
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					expect(error.code).toBe('P2002');
				}
			}
		});
	});

	describe('getMediaByName', () => {
		test('should retrieve media by name and guild id', async () => {
			await mediaService.createMediaRecord(testMedia);
			const found = await mediaService.getMediaByName(
				testMedia.name,
				testGuildId,
			);

			expect(found).toBeDefined();
			if (found) {
				expect(found.name).toBe(testMedia.name);
				expect(found.guildId).toBe(testGuildId);
			}
		});

		test('should return null for non-existent media', async () => {
			const found = await mediaService.getMediaByName(
				'non-existent',
				testGuildId,
			);
			expect(found).toBeNull();
		});
	});

	describe('listGuildMedia', () => {
		test('should list all media for a guild', async () => {
			const media1 = { ...testMedia, name: 'test-1' };
			const media2 = { ...testMedia, name: 'test-2' };

			await mediaService.createMediaRecord(media1);
			await mediaService.createMediaRecord(media2);

			const guildMedia = await mediaService.listGuildMedia(testGuildId);
			expect(guildMedia).toHaveLength(2);
			expect(guildMedia.every((media) => media.guildId === testGuildId)).toBe(
				true,
			);
		});

		test('should return empty array for guild with no media', async () => {
			const guildMedia = await mediaService.listGuildMedia('empty-guild');
			expect(guildMedia).toHaveLength(0);
		});
	});

	describe('deleteMediaRecord', () => {
		test('should delete media record', async () => {
			const created = await mediaService.createMediaRecord(testMedia);
			await mediaService.deleteMediaRecord(created.id);

			const found = await mediaService.getMediaByName(
				testMedia.name,
				testGuildId,
			);
			expect(found).toBeNull();
		});

		test('should handle non-existent media deletion error', async () => {
			try {
				await mediaService.deleteMediaRecord('non-existent-id');
				throw new Error('Should have thrown an error');
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect(error instanceof Prisma.PrismaClientKnownRequestError).toBe(
					true,
				);
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					expect(error.code).toBe('P2025');
				}
			}
		});
	});
});
