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

  static async updateCategory(id: string, data: Prisma.CategoryUpdateInput) {
    return categoryRepository.update(id, data);
  }

  static async deleteCategory(id: string) {
    return categoryRepository.delete(id);
  }
}
