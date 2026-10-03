import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // Runtime traffic uses DATABASE_URL. Prisma CLI migration commands should
    // prefer DIRECT_URL so they do not run through a transaction pooler.
    url:
      process.env.DIRECT_URL ||
      process.env.DATABASE_URL ||
      'postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public',
  },
});
