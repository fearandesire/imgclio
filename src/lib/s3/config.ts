/**
 * Configuration for AWS S3
 * Since we are using Bun, we do not need to specify the AWS credentials in the code.
 * They can be automatically loaded from the appropriate environment variables.
 * This configuration will be used for other specific S3 & code based operations
 */
export const s3Config = {
	imageBase: 'images', // The folder path from root where images will be uploaded
};
