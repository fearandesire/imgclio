import { type } from 'arktype';

export const customErrorNames = [
	'FileSizeError',
	'FileTypeError',
	'FileValidationError',
] as const;

export class CustomError extends Error {
	constructor(message: string, name: (typeof customErrorNames)[number]) {
		super(message);
		this.name = name;
	}
}

/**
 * Type for application errors
 * @typedef {Object} AppError
 * @property {string} message - The error message
 * @property {string} name - The name of the error
 * @property {string} stack - The stack trace of the error
 * @property {string} code - The error code
 * @property {object} details - Additional details about the error
 */

const appError = type({
	message: 'string',
	name: 'string',
	stack: 'string?',
	code: 'string?',
	details: 'object?',
});

export type AppError = typeof appError.infer;
