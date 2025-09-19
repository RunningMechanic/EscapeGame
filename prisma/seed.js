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
        await prisma.user.create({
            data: {
                email: user.email,
                password: hashedPassword,
            },
        });
        console.log(`Created user: ${user.email}`);
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