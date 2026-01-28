import { PrismaClient } from '../generated/prisma/client'
import { PrismaPostgresAdapter } from '@prisma/adapter-ppg'

const prismaClientSingleton = () => {
  const prisma = new PrismaClient({
    log: [
      { level: 'warn', emit: 'event' },
      { level: 'info', emit: 'event' },
      { level: 'error', emit: 'event' },
      {level : 'query', emit: 'event'},
    ],
    adapter: new PrismaPostgresAdapter({
      connectionString: process.env.DATABASE_URL!,
    }),
  })

  // prisma.$on('query', (e) => {
  //   console.log('Query: ' + e.query);
  //   console.log('Params: ' + e.params);
  //   console.log('Duration: ' + e.duration + 'ms');
  // });

  // prisma.$on('warn', (e) => {
  //   console.log(e);
  // });

  // prisma.$on('info', (e) => {
  //   console.log(e);
  // });

  // prisma.$on('error', (e) => {
  //   console.log(JSON.stringify(e,null,3));
  // });
  return prisma;
}

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma