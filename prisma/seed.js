import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const users = Array.from({ length: 40 }, (_, i) => ({
  email: `user${i + 1}@example.com`,
  password: `password${i + 1}`,
}));

async function main() {
  console.log('seed start');
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {}, // 既存の場合は何も変更しない
      create: {
        email: user.email,
        password: hashedPassword,
      },
    });
    console.log(`Upserted user: ${user.email}`);
  }
}

main()
  .catch(e => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
