import winston from 'winston';
import { consoleFormat } from 'winston-console-format';
import DailyRotateFile from 'winston-daily-rotate-file';

// Core Winston Config
const coreWinstonConfig = {
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.errors({ stack: true }),
		winston.format.metadata({
			fillExcept: ['message', 'level', 'timestamp', 'stack'],
		}),
		winston.format.json(),
	),
};

// Shared Config between Winston Transports
const baseWinstonConfig = {
	...coreWinstonConfig,
	datePattern: 'YYYY-MM-DD',
	zippedArchive: false,
	maxFiles: '14d',
	maxSize: '80MB',
};

const winstonConsoleConfig = {
	format: winston.format.combine(
		winston.format.colorize({ all: true }),
		winston.format.timestamp({ format: 'MM/DD HH:mm:ss' }),
		winston.format.padLevels(),
		consoleFormat({
			showMeta: true,
			inspectOptions: {
				depth: 4,
				colors: true,
				maxArrayLength: 10,
				breakLength: 120,
				compact: Number.POSITIVE_INFINITY,
			},
		}),
	),
};

const createDailyRotateFileTransport = (level: string, filename: string) => {
	return new DailyRotateFile({
		level,
		filename: `logs/%DATE%-${filename}.log`,
		...baseWinstonConfig,
	});
};

const consoleTransport = new winston.transports.Console({
	...winstonConsoleConfig,
});

const transports: winston.transport[] = [
	createDailyRotateFileTransport('error', 'error'),
	createDailyRotateFileTransport('info', 'standard'),
	createDailyRotateFileTransport('debug', 'debug'),
	consoleTransport,
];

export interface ILogger {
	info(message: string, meta?: Record<string, unknown>): void;
	error(
		message: string,
		error?: Error | unknown,
		meta?: Record<string, unknown>,
	): void;
	debug(message: string, meta?: Record<string, unknown>): void;
	warn(message: string, meta?: Record<string, unknown>): void;
}

export class AppLogger implements ILogger {
	private logger: winston.Logger;

	constructor() {
		this.logger = winston.createLogger({
			defaultMeta: {
				source_application: 'imgclio',
				environment: process.env.NODE_ENV,
			},
			transports,
			exitOnError: false,
		});
	}

	info(message: string, meta?: Record<string, unknown>): void {
		this.logger.info(message, meta);
	}

	error(
		message: string,
		error?: Error | unknown,
		meta?: Record<string, unknown>,
	): void {
		// If error is provided, let Winston handle the error formatting
		if (error instanceof Error) {
			this.logger.error(message, { ...meta, error });
			return;
		}

		// For non-Error objects, include them in meta
		if (error !== undefined) {
			this.logger.error(message, { ...meta, ...error });
			return;
		}

		this.logger.error(message, meta);
	}

	debug(message: string, meta?: Record<string, unknown>): void {
		this.logger.debug(message, meta);
	}

	warn(message: string, meta?: Record<string, unknown>): void {
		this.logger.warn(message, meta);
	}
}

export const Logger = new AppLogger();
