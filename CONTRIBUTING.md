# Contributing to ImgClio

## Setting Up Development Environment

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/yourusername/imgclio.git
   cd imgclio
   ```
2. **Install dependencies**
   ```bash
   bun install
   ```
3. **Set up your local PostgreSQL database**
   - Ensure PostgreSQL is installed and running
   - Create a database for the project
   
4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   - Edit the `.env` file with your configuration

5. **Generate Prisma client and apply migrations**
   ```bash
   bun db:migrate:dev
   bun db:generate
   ```

6. **Run the development server**
   ```bash
   bun run dev
   ```

## Running Tests

Tests use a separate PostgreSQL database with dummy credentials for external services.

1. **Ensure PostgreSQL is running locally**
2. **Run the test suite**
   ```bash
   bun test
   ```

## Pull Request Process

1. **Create a new branch for your feature**
2. **Please write tests for new features, if applicable**
3. **Ensure all tests pass locally [bun test]** *(CI/CD actions will verify this as well)
4. **Submit a pull request**

All pull requests will automatically run tests in GitHub Actions against a clean PostgreSQL database.

## Code Style

Biome.js will apply linting on pre-commit.
You can also run `bun lint` as well.

## Additional Setup Documentation (AWS & Discord)

Refer to AWS S3, CloudFront, and Discord Bot documentation for creating the necessary resources from their respective websites -- if you need help.
