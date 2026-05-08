import { categoryRepository } from '@/repositories/category.repository';
import type { Prisma, CategoryType } from '@prisma/client';

export class CategoryService {
  static async getAllCategories() {
    return categoryRepository.findAll();
  }

  static async getCategoriesByType(type: CategoryType) {
    return categoryRepository.findByType(type);
  }

  static async createCategory(data: Prisma.CategoryCreateInput) {
    return categoryRepository.create(data);
  }
}
