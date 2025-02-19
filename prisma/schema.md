# Database Schema Documentation

## Media Model
Storage and metadata tracking for uploaded media files.

| Field      | Type     | Attributes           | Description                 |
| ---------- | -------- | -------------------- | --------------------------- |
| id         | UUID     | @id @default(uuid()) | Primary key identifier      |
| name       | String   | @unique              | Command reference name      |
| url        | String   | -                    | CDN storage URL             |
| uploadedBy | String   | -                    | Discord user ID of uploader |
| guildId    | String   | -                    | Discord server ID           |
| fileKey    | String   | -                    | S3 storage path/key         |
| mimeType   | String   | -                    | File content type           |
| fileSize   | Int      | -                    | File size in bytes          |
| createdAt  | DateTime | @default(now())      | Creation timestamp          |
| updatedAt  | DateTime | @updatedAt           | Last modified timestamp     |

### Constraints & Indexes
- **Unique Constraints**
  - `@@unique([guildId, name])`: Ensures command names are unique per guild
- **Indexes**
  - `@@index([guildId, name])`: Optimizes media retrieval queries
  - `@@index([uploadedBy])`: Optimizes user upload queries

### Constraints & Indexes
- **Indexes**
  - `@@index([status])`: Optimizes status-based queries
  - `@@index([createdAt])`: Optimizes temporal queries

## Technical Details
- **Database**: PostgreSQL
- **Relation Mode**: Prisma
- **Client Generator**: prisma-client-js
