export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LogMetadata {
	timestamp: string;
	[key: string]: unknown;
}
