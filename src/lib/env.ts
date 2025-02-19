import { type } from 'arktype';
import { config } from 'dotenv';
import { envSchema } from '../types/env.types.js';
config();

const env = envSchema(process.env);

if (env instanceof type.errors) {
	console.error('Environment validation failed:', env.summary);
	process.exit(1);
}

// Export validated environment variables
export const {
	NODE_ENV,
	POSTGRES_USER,
	POSTGRES_PASSWORD,
	PRISMA_DB_URL,
	AWS_BUCKET,
	CDN_HOSTNAME,
	CDN_URL,
	ORIGIN_HOSTNAME,
	ORIGIN_URL,
	DISCORD_TOKEN,
} = env;
