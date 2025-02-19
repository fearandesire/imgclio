import { type } from 'arktype';

// Define the environment schema
export const envSchema = type({
	// Node environment
	NODE_ENV: "'development' | 'production' | 'test'",

	// Database credentials
	POSTGRES_USER: 'string',
	POSTGRES_PASSWORD: 'string',

	// Prisma URLs - using regex to validate URL format
	PRISMA_DB_URL: '/^postgresql:\\/\\/.+$/',

	// AWS S3 credentials
	AWS_BUCKET: 'string',

	// AWS CDN credentials
	CDN_HOSTNAME: 'string',
	CDN_URL: 'string',

	// AWS Origin credentials
	ORIGIN_HOSTNAME: 'string',
	ORIGIN_URL: 'string',

	// Discord bot token
	DISCORD_TOKEN: 'string',
});

// Extract the type for use in other files
export type Env = typeof envSchema.infer;
