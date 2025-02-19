import { PrismaClient } from '@prisma/client';
/* 
Not used in any tests currently, simply a placeholder to seed the DB.
*/

const prisma = new PrismaClient();

async function main() {
	// Test guild IDs
	const testGuildIds = ['test-guild-123', 'test-guild-456'];
	const testUserIds = ['user-123', 'user-456'];

	// Clean up existing test data
	await prisma.media.deleteMany({
		where: {
			guildId: {
				in: testGuildIds,
			},
		},
	});

	// Create sample/test media records
	const testMedia = [
		{
			name: 'test-image-1',
			url: 'https://example.com/test-image-1.jpg',
			uploadedBy: testUserIds[0],
			guildId: testGuildIds[0],
			fileKey: 'images/test-image-1.jpg',
			mimeType: 'image/jpeg',
			fileSize: 1024,
		},
		{
			name: 'test-image-2',
			url: 'https://example.com/test-image-2.jpg',
			uploadedBy: testUserIds[0],
			guildId: testGuildIds[0],
			fileKey: 'images/test-image-2.jpg',
			mimeType: 'image/jpeg',
			fileSize: 2048,
		},
		{
			name: 'test-gif',
			url: 'https://example.com/test-animation.gif',
			uploadedBy: testUserIds[1],
			guildId: testGuildIds[1],
			fileKey: 'images/test-animation.gif',
			mimeType: 'image/gif',
			fileSize: 4096,
		},
	];

	// Insert sample/test media records
	for (const media of testMedia) {
		await prisma.media.create({
			data: media,
		});
	}

	console.log('🌱 Seed data created successfully');
}

main()
	.catch((e) => {
		console.error('Error seeding database:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
