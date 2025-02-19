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

describe('MediaRepo Integration Tests', () => {
	let prisma: PrismaClient;
	let mediaRepo: MediaRepo;

	// Test data
	const testGuildId = 'test-guild-123';
	const testMedia = {
		name: 'test-image',
		url: 'https://example.com/test-image.jpg',
		uploadedBy: 'user-123',
		guildId: testGuildId,
		fileKey: 'images/test-image.jpg',
		mimeType: 'image/jpeg',
		fileSize: 1024,
	};

	beforeAll(async () => {
		prisma = new PrismaClient();
		mediaRepo = new MediaRepo(prisma);
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

	describe('create', () => {
		test('should create a new media record', async () => {
			const media = await mediaRepo.create(testMedia);

			expect(media).toBeDefined();
			expect(media.name).toBe(testMedia.name);
			expect(media.guildId).toBe(testMedia.guildId);
			expect(media.fileKey).toBe(testMedia.fileKey);
		});

		test('should throw PrismaClientKnownRequestError when creating media with duplicate name in same guild', async () => {
			await mediaRepo.create(testMedia);

			try {
				await mediaRepo.create(testMedia);
				throw new Error('Should have thrown a PrismaClientKnownRequestError');
			} catch (error) {
				expect(error).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
				expect((error as Prisma.PrismaClientKnownRequestError).code).toBe(
					'P2002',
				);
			}
		});
	});

	describe('findById', () => {
		test('should find media by id', async () => {
			const created = await mediaRepo.create(testMedia);
			const found = await mediaRepo.findById(created.id);

			expect(found).toBeDefined();
			expect(found?.id).toBe(created.id);
		});

		test('should return null for non-existent id', async () => {
			const found = await mediaRepo.findById('non-existent-id');
			expect(found).toBeNull();
		});
	});

	describe('findByName', () => {
		test('should find media by name and guild id', async () => {
			await mediaRepo.create(testMedia);
			const found = await mediaRepo.findByName(testMedia.name, testGuildId);

			expect(found).toBeDefined();
			expect(found?.name).toBe(testMedia.name);
			expect(found?.guildId).toBe(testGuildId);
		});

		test('should return null for non-existent media', async () => {
			const found = await mediaRepo.findByName('non-existent', testGuildId);
			expect(found).toBeNull();
		});
	});

	describe('findByGuild', () => {
		test('should find all media in a guild', async () => {
			const media1 = { ...testMedia, name: 'test-1' };
			const media2 = { ...testMedia, name: 'test-2' };

			await mediaRepo.create(media1);
			await mediaRepo.create(media2);

			const guildMedia = await mediaRepo.findByGuild(testGuildId);
			expect(guildMedia).toHaveLength(2);
			expect(guildMedia.every((media) => media.guildId === testGuildId)).toBe(
				true,
			);
		});

		test('should return empty array for guild with no media', async () => {
			const guildMedia = await mediaRepo.findByGuild('empty-guild');
			expect(guildMedia).toHaveLength(0);
		});
	});

	describe('update', () => {
		test('should update media record', async () => {
			const created = await mediaRepo.create(testMedia);
			const updatedName = 'updated-name';

			const updated = await mediaRepo.update(created.id, { name: updatedName });
			expect(updated.name).toBe(updatedName);
		});

		test('should throw PrismaClientKnownRequestError when updating to existing name in same guild', async () => {
			const media1 = await mediaRepo.create(testMedia);
			const media2 = await mediaRepo.create({ ...testMedia, name: 'test-2' });

			try {
				await mediaRepo.update(media2.id, { name: media1.name });
				throw new Error('Should have thrown a PrismaClientKnownRequestError');
			} catch (error) {
				expect(error).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
				expect((error as Prisma.PrismaClientKnownRequestError).code).toBe(
					'P2002',
				);
			}
		});
	});

	describe('delete', () => {
		test('should delete media record', async () => {
			const created = await mediaRepo.create(testMedia);
			await mediaRepo.delete(created.id);

			const found = await mediaRepo.findById(created.id);
			expect(found).toBeNull();
		});

		test('should throw PrismaClientKnownRequestError when deleting non-existent media', async () => {
			try {
				await mediaRepo.delete('non-existent-id');
				throw new Error('Should have thrown a PrismaClientKnownRequestError');
			} catch (error) {
				expect(error).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
				expect((error as Prisma.PrismaClientKnownRequestError).code).toBe(
					'P2025',
				);
			}
		});
	});
});
