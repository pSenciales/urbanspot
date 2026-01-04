import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const adapter = new PrismaMariaDb({
  host: process.env.MYSQL_DBHOSTNAME,
  user: process.env.MYSQL_DBUSER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DBNAME
});
const prisma = new PrismaClient({
  log: ['query'],
  adapter: adapter
});

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export {prisma}
