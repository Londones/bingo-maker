export const prisma = {
  bingo: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  suggestion: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};
