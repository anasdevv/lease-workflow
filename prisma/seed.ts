import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client'
import { PrismaPostgresAdapter } from '@prisma/adapter-ppg'
console.log('db url ' ,process.env.DATABASE_URL);
const prisma = new PrismaClient({
  adapter: new PrismaPostgresAdapter({
    connectionString: process.env.DATABASE_URL!,
  }),
})

async function main() {
  console.log('Start seeding...')

  await prisma.humanReviewDecision.deleteMany()
  await prisma.applicationDocument.deleteMany()
  await prisma.document.deleteMany()
  await prisma.application.deleteMany()
  await prisma.listing.deleteMany()

  // Create listings
  const listing1 = await prisma.listing.create({
    data: {
      address: '123 Main St, San Francisco, CA',
    },
  })

  const listing2 = await prisma.listing.create({
    data: {
      address: '456 Market St, San Francisco, CA',
    },
  })

  

  console.log('Created listings:', { listing1, listing2 })
  
  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })