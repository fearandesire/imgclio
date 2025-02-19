import { FileValidationError } from '../lib/validation/errors.js';
import type { AppError } from '../types/error.types.js';
import { CustomError } from '../types/error.types.js';
import type { ILogger } from './logger.js';

export interface IErrorHandler {
	handleFatalError(error: unknown, meta?: Record<string, unknown>): void;
	handleOperationalError(error: unknown, meta?: Record<string, unknown>): void;
	handleValidationError(
		error: FileValidationError,
		meta?: Record<string, unknown>,
	): void;
	handleError(error: unknown, meta?: Record<string, unknown>): void;
}
export class ErrorHandler implements IErrorHandler {
	constructor(private logger: ILogger) {}

	/**
	 * Handles fatal application errors
	 * @param error - The error to handle
	 * @param meta - Additional metadata to log
	 */
	handleFatalError(error: unknown, meta?: Record<string, unknown>): void {
		const normalizedError = this.normalizeError(error);
		this.logger.error('Fatal application error occurred', normalizedError, {
			errorType: 'fatal',
			...meta,
		});
	}

	/**
	 * Handles operational errors
	 * @param error - The error to handle
	 * @param meta - Additional metadata to log
	 */
	handleOperationalError(error: unknown, meta?: Record<string, unknown>): void {
		const normalizedError = this.normalizeError(error);
		this.logger.error('Operational error occurred', normalizedError, {
			errorType: 'operational',
			...meta,
		});
	}

	/**
	 * Handles validation errors
	 * @param error - The validation error to handle
	 * @param meta - Additional metadata to log
	 */
	handleValidationError(
		error: FileValidationError,
		meta?: Record<string, unknown>,
	): void {
		const normalizedError = this.normalizeError(error);
		this.logger.error('Validation error occurred', normalizedError, {
			errorType: 'validation',
			validationType: error.name,
			...meta,
		});
	}

	/**
	 * Routes the error to the appropriate handler based on its type
	 * @param error - The error to handle
	 * @param meta - Additional metadata to log
	 */
	public handleError(error: unknown, meta?: Record<string, unknown>): void {
		if (error instanceof FileValidationError) {
			this.handleValidationError(error, meta);
			return;
		}

		if (error instanceof CustomError) {
			this.handleOperationalError(error, {
				...meta,
				customErrorType: error.name,
			});
			return;
		}

		// Handle unexpected errors as fatal
		this.handleFatalError(error, meta);
	}

	/**
	 * Normalizes any error into a standard AppError format
	 * @param error - The error to normalize
	 * @returns Normalized AppError
	 */
	private normalizeError(error: unknown): AppError {
		if (error instanceof Error) {
			const details =
				error instanceof CustomError ? { type: error.name } : undefined;

			return {
				message: error.message,
				name: error.name,
				...(error.stack && { stack: error.stack }),
				...(details && { details }),
			};
		}
		const stack = new Error().stack;
		return {
			message: String(error),
			name: 'UnknownError',
			...(stack && { stack }),
		};
	}
}
