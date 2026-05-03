import '@testing-library/jest-dom';
import { prisma } from './prisma';

afterAll(async () => {
  await prisma.$disconnect();
});
