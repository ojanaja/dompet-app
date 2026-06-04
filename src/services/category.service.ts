import { categoryRepository } from '@/repositories/category.repository';
import { DEFAULT_CATEGORIES } from '@/lib/category-defaults';
import type { Prisma, CategoryType } from '@prisma/client';

export class CategoryService {
  static async getUserCategories(userId: string) {
    if (!userId) throw new Error("User ID is required");
    let categories = await categoryRepository.findUserCategories(userId);

    if (categories.length === 0) {
      await Promise.all(DEFAULT_CATEGORIES.map(category =>
        categoryRepository.create({
          ...category,
          userId,
        } satisfies Prisma.CategoryUncheckedCreateInput)
      ));
      categories = await categoryRepository.findUserCategories(userId);
    }

    return categories;
  }

  static async getCategoriesByType(userId: string, type: CategoryType) {
    if (!userId) throw new Error("User ID is required");
    return categoryRepository.findByType(userId, type);
  }

  static async createCategory(userId: string, data: Omit<Prisma.CategoryUncheckedCreateInput, 'userId'>) {
    if (!userId) throw new Error("User ID is required");
    if (!data.name?.trim()) throw new Error("Category name is required");
    return categoryRepository.create({
      ...data,
      name: data.name.trim(),
      userId,
    } satisfies Prisma.CategoryUncheckedCreateInput);
  }

  static async updateCategory(id: string, userId: string, data: Prisma.CategoryUpdateInput) {
    const category = await categoryRepository.findUserCategoryById(id, userId);
    if (!category) {
      throw new Error("Category not found or unauthorized");
    }
    return categoryRepository.update(id, data);
  }

  static async deleteCategory(id: string, userId: string) {
    const category = await categoryRepository.findUserCategoryById(id, userId);
    if (!category) {
      throw new Error("Category not found or unauthorized");
    }
    return categoryRepository.delete(id);
  }
}
