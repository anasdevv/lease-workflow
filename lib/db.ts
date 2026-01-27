import { PrismaClient } from '../generated/prisma/client'
import { PrismaPostgresAdapter } from '@prisma/adapter-ppg'

const prismaClientSingleton = () => {
  return new PrismaClient({
    adapter: new PrismaPostgresAdapter({
      connectionString: process.env.DATABASE_URL!,
    }),
  })
}

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma