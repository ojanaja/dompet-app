import { prisma } from '@/lib/prisma';
import { BaseRepository } from './base.repository';
import type { Prisma } from '@prisma/client';

class UserRepository extends BaseRepository<Prisma.UserDelegate> {
  constructor() {
    super(prisma.user);
  }

  async findByEmail(email: string) {
    return this.model.findUnique({ where: { email } });
  }
}

export const userRepository = new UserRepository();
