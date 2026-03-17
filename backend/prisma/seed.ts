import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_USER = {
  email: 'demo@fer.local',
  username: 'demo_user',
  passwordHash: 'demo-password-not-for-production',
  role: Role.USER,
};

async function main() {
  await prisma.user.upsert({
    where: { email: DEMO_USER.email },
    update: {
      username: DEMO_USER.username,
      passwordHash: DEMO_USER.passwordHash,
      role: DEMO_USER.role,
    },
    create: DEMO_USER,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
