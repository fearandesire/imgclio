import { PrismaClient } from '@prisma/client';

/**
 * Infrastructure Wrapper for Prisma database access
 * Follows Nullability pattern for testing
 */
export class PrismaWrapper {
	private static instance: PrismaWrapper;
	private client: PrismaClient;

	private constructor() {
		this.client = new PrismaClient({
			log:
				process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
		});
	}

	public static getInstance(): PrismaWrapper {
		if (!PrismaWrapper.instance) {
			PrismaWrapper.instance = new PrismaWrapper();
		}
		return PrismaWrapper.instance;
	}

	public getClient(): PrismaClient {
		return this.client;
	}

	/**
	 * Validates and establishes database connection
	 */
	public async connect(): Promise<void> {
		await this.client.$connect();
	}

	/**
	 * Disconnects from the database
	 */
	public async disconnect(): Promise<void> {
		await this.client.$disconnect();
	}

	/**
	 * Creates a null version for testing
	 * This allows tests to run without a real database
	 */
	public static createNull(
		mockData: Record<string, unknown> = {},
	): PrismaWrapper {
		const nullWrapper = new PrismaWrapper();
		// Override the client with a mock that returns the provided data
		nullWrapper.client = mockData as unknown as PrismaClient;
		return nullWrapper;
	}
}

// Export the singleton instance
export const prisma = PrismaWrapper.getInstance().getClient();
