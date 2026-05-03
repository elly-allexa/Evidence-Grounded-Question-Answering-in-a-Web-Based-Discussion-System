import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const demoUser1 = await prisma.user.upsert({
    where: { email: 'demo@fer.local' },
    update: {
      username: 'demo_user1',
      isDeleted: false,
      deletedAt: null,
    },
    create: {
      email: 'demo@fer.local',
      username: 'demo_user1',
      passwordHash: null,
      role: Role.USER,
    },
  });

  const demoUser2 = await prisma.user.upsert({
    where: { email: 'demo2@fer.local' },
    update: {
      username: 'demo_user2',
      isDeleted: false,
      deletedAt: null,
    },
    create: {
      email: 'demo2@fer.local',
      username: 'demo_user2',
      passwordHash: null,
      role: Role.USER,
    },
  });

  console.log('Seeded demo users:');
  console.log(demoUser1);
  console.log(demoUser2);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
