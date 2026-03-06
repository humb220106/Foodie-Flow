using FoodOrdering.Application.Repositories;
using FoodOrdering.Core.Entities;
using FoodOrdering.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Infrastructure.Repositories
{
    public class CategoryRepository : ICategoryRepository
    {
        private readonly AppDbContext _context;
        public CategoryRepository(AppDbContext context)
        {
            _context = context;
        }
        public async Task<Category> CreateAsync(Category category)
        {
            _context.Categories.Add(category);
            await _context.SaveChangesAsync();
            return category;
        }

        public async Task DeleteAsync(Guid id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category != null)
            {
                _context.Categories.Remove(category);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<List<Category>> GetAllAsync()
        {
            return await _context.Categories
            .Include(c => c.SubCategories)
            .Where(c => c.IsActive)
            .OrderBy(c => c.DisplayOrder)
            .ToListAsync();
        }

        public async Task<Category?> GetByIdAsync(Guid id)
        {
            return await _context.Categories
            .Include(c => c.SubCategories)
            .Include(c => c.ParentCategory)
            .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<Category?> GetBySlugAsync(string slug)
        {
            return await _context.Categories
             .Include(c => c.SubCategories)
             .FirstOrDefaultAsync(c => c.Slug == slug);
        }

        public async Task<List<Category>> GetRootCategoriesAsync()
        {
            return await _context.Categories
             .Include(c => c.SubCategories)
             .Where(c => c.ParentCategoryId == null && c.IsActive)
             .OrderBy(c => c.DisplayOrder)
             .ToListAsync();
        }

        public async Task<List<Category>> GetSubCategoriesAsync(Guid parentId)
        {
            return await _context.Categories
             .Where(c => c.ParentCategoryId == parentId && c.IsActive)
             .OrderBy(c => c.DisplayOrder)
             .ToListAsync();
        }

        public async Task<bool> IsSlugUniqueAsync(string slug, Guid? excludeCategoryId = null)
        {
            return !await _context.Categories
            .Where(c => c.Slug == slug && (excludeCategoryId == null || c.Id != excludeCategoryId))
            .AnyAsync();
        }

        public async Task UpdateAsync(Category category)
        {
            category.UpdatedAt = DateTime.UtcNow;
            _context.Categories.Update(category);
            await _context.SaveChangesAsync();
        }
    }
}

