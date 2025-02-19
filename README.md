# ImgClio

Image Command Discord bot. Store images & gifs dynamically as 'commands' and retrieve them by the same name. Utilizing Sapphire.js/Discord.js, Prisma, AWS S3, and CloudFront.

Images are hoisted into an S3 bucket - so there's no fear of images being deleted or lost when a discord message is deleted. You are in full control of the data.

## Features

- **Accessible**: Upload images and GIFs through Discord commands
  - Slash command, message command support
  - Direct upload & direct link support
- **Reliable Storage**: AWS S3 backend for secure media storage
- **Fast Delivery**: CloudFront CDN integration for content delivery
- **Server-Specific**: Dedicated storage per Discord server

## Architecture

ImgClio consists of four main components:

1. **Discord Bot**: Built with Sapphire.js/Discord.js, handles user interactions and commands
2. **Storage Layer**: AWS S3 + CloudFront for media storage and delivery
3. **Database**: PostgreSQL for storing media metadata
4. **API Layer**: Manages communication between the bot, database, and AWS services

## Prerequisites

- [Bun](https://bun.sh/)
- [PostgreSQL](https://www.postgresql.org/)
- [AWS S3](https://aws.amazon.com/s3/)
- [AWS CloudFront](https://aws.amazon.com/cloudfront/)
- [Discord Bot](https://discord.com/developers/applications)

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/imgclio.git
   cd imgclio
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration

4. **Setup database**
   ```bash
   bun prisma generate
   bun prisma migrate dev
   ```

5. **Start the bot**
   ```bash
   bun run dev
   ```

## Environment Variables

- See `.env.example` for the required environment variables

### Setting Up AWS Resources

1. Create an S3 bucket
2. Set up a CloudFront distribution pointing to your S3 bucket
3. Create an IAM user with S3 permissions
4. Generate access keys for the IAM user
5. Update `.env` with AWS credentials and URLs

### Setting Up Discord Bot

1. Create a new application in the Discord Developer Portal
2. Create a bot for your application
3. Enable necessary bot permissions
4. Copy the bot token to your `.env` file
5. Invite the bot to your server

## Development

**Tech stack:**
- [Bun](https://bun.sh/)
- [Prisma](https://www.prisma.io/)
- [Discord.js](https://discord.js.org/)
- [Sapphire.js](https://sapphirejs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [ArkType](https://arktype.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [AWS S3](https://aws.amazon.com/s3/)
- [AWS CloudFront](https://aws.amazon.com/cloudfront/)

## Contributing

**Contributions welcome❗** 
### Review [CONTRIBUTING.md](CONTRIBUTING.md) for more information.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For problems or questions, please [open an issue](https://github.com/fearandesire/imgclio/issues/new).