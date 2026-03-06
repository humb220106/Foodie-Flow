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
    public class DishRepository : IDishRepository
    {
        private readonly AppDbContext _context;
        public DishRepository(AppDbContext context)
        {
            _context = context;
        }
        public async Task<Dish> CreateAsync(Dish dish)
        {
           await _context.Dishes.AddAsync(dish);
            await _context.SaveChangesAsync();
            return dish;
        }

        public async Task DeleteAsync(Guid id)
        {
            var product = await _context.Dishes.FindAsync(id);
            if (product != null)
            {
                _context.Dishes.Remove(product);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<List<Dish>> GetAllAsync(int skip = 0, int take = 20)
        {
          return await _context.Dishes.Include(d => d.Restaurant).
                Include(d => d.Category).
                Where(d => d.IsActive)
                .OrderByDescending(d => d.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<List<Dish>> GetByCategoryIdAsync(Guid categoryId, int skip = 0, int take = 20)
        {
           return await _context.Dishes.Include(d => d.Restaurant).
                Include(d => d.Category).
                Where(d => d.CategoryId == categoryId && d.IsActive)
                .OrderByDescending(d => d.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<Dish?> GetByIdAsync(Guid id)
        {
           return await _context.Dishes.Include(d => d.Restaurant).
                Include(d => d.Category).Include(d => d.Reviews).
                FirstOrDefaultAsync(d => d.Id == id && d.IsActive);
        }

        public async Task<Dish?> GetByIdWithLockAsync(Guid id)
        {
            var dish = await _context.Set<Dish>()
               .FromSqlRaw("SELECT * FROM Dishes WITH (UPDLOCK, ROWLOCK) WHERE Id = {0}", id)
               .FirstOrDefaultAsync();
            return dish;
        }

        public async Task<List<Dish>> GetByRestaurantIdAsync(Guid RestaurantId, int skip = 0, int take = 20)
        {
            return await _context.Dishes.Include(d => d.Restaurant).
                Include(d => d.Category).Include(d => d.Reviews).
                Where(d => d.RestaurantId == RestaurantId && d.IsActive)
                .OrderByDescending(d => d.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<Dish?> GetBySlugAsync(string slug)
        {
           return await _context.Dishes.Include(d => d.Restaurant).
                Include(d => d.Category).Include(d => d.Reviews).
                FirstOrDefaultAsync(d => d.Slug == slug && d.IsActive);
        }

        public async Task IncrementViewCountAsync(Guid dishId)
        {
            var dish = await _context.Dishes.FindAsync(dishId);
            if (dish != null)
            {
                dish.ViewCount++;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> IsSlugUniqueAsync(string slug, Guid? excludeDishId = null)
        {
            return !await _context.Dishes
            .Where(d => d.Slug == slug && (excludeDishId == null || d.Id != excludeDishId))
            .AnyAsync();
        }

        public async Task<List<Dish>> SearchAsync(string searchTerm, Guid? categoryId = null, decimal? minPrice = null, decimal? maxPrice = null, int skip = 0, int take = 20)
        {
            var query = _context.Dishes
             .Include(p => p.Restaurant)
             
             .Include(p => p.Category)
             .Where(p => p.IsActive && p.Status == "Active");

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                query = query.Where(p =>
                    p.Title.Contains(searchTerm) ||
                    p.Description.Contains(searchTerm) ||
                    (p.Tags != null && p.Tags.Contains(searchTerm)));
            }

            if (categoryId.HasValue)
            {
                query = query.Where(p => p.CategoryId == categoryId.Value);
            }

            if (minPrice.HasValue)
            {
                query = query.Where(p => p.Price >= minPrice.Value);
            }

            if (maxPrice.HasValue)
            {
                query = query.Where(p => p.Price <= maxPrice.Value);
            }

            return await query
                .OrderByDescending(p => p.IsAvailable)
                .ThenByDescending(p => p.IsFeatured)
                .ThenByDescending(p => p.ViewCount)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task UpdateAsync(Dish dish)
        {
            dish.UpdatedAt = DateTime.UtcNow;
            _context.Dishes.Update(dish);
            await _context.SaveChangesAsync();
        }
        public async Task<int> GetTotalCountAsync()
        {
            return await _context.Dishes.CountAsync(d => d.IsActive);
        }
    }
}
