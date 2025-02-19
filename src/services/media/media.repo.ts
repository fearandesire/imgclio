import type { Media, PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

export interface IMediaRepo {
	create(data: Prisma.MediaCreateInput): Promise<Media>;
	findById(id: string): Promise<Media | null>;
	findByName(name: string, guildId: string): Promise<Media | null>;
	findByGuild(guildId: string): Promise<Media[]>;
	update(id: string, data: Prisma.MediaUpdateInput): Promise<Media>;
	delete(id: string): Promise<void>;
}

export class MediaRepo implements IMediaRepo {
	constructor(readonly prisma: PrismaClient) {}

	public async create(data: Prisma.MediaCreateInput): Promise<Media> {
		const media = await this.prisma.media.create({
			data,
		});
		return media;
	}

	public async findById(id: string): Promise<Media | null> {
		const media = await this.prisma.media.findUnique({
			where: { id },
		});
		return media;
	}

	public async findByName(
		name: string,
		guildId: string,
	): Promise<Media | null> {
		const media = await this.prisma.media.findUnique({
			where: {
				guildId_name: {
					guildId,
					name,
				},
			},
		});
		return media;
	}

	public async findByGuild(guildId: string): Promise<Media[]> {
		const media = await this.prisma.media.findMany({
			where: { guildId },
			orderBy: { createdAt: 'desc' },
		});
		return media;
	}

	public async update(
		id: string,
		data: Prisma.MediaUpdateInput,
	): Promise<Media> {
		const media = await this.prisma.media.update({
			where: { id },
			data,
		});
		return media;
	}

	public async delete(id: string): Promise<void> {
		await this.prisma.media.delete({
			where: { id },
		});
	}
}
