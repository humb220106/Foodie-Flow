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
    public class RestaurantRepository : IRestaurantRepository
    {
        private readonly AppDbContext _context;
        public RestaurantRepository(AppDbContext context)
        {
            _context = context;
        }
        public async Task<Restaurant> CreateAsync(Restaurant restaurant)
        {
             _context.Restaurants.Add(restaurant);
            await _context.SaveChangesAsync();
            return restaurant;
        }

        public async Task<Restaurant?> GetByIdAsync(Guid id)
        {
            return await _context.Restaurants.Include(r => r.User).Include(r => r.Dishes).
                FirstOrDefaultAsync(r => r.Id == id);


        }

        public async Task<Restaurant?> GetBySlugAsync(string slug)
        {
           return await _context.Restaurants.Include(r => r.User).Include(r => r.Dishes.Where(d=>d.IsActive)).
                FirstOrDefaultAsync(r=>r.RestaurantSlug.ToLower() == slug.ToLower()
);
        }

        public async Task<Restaurant?> GetByUserIdAsync(Guid userId)
        {
            return await _context.Restaurants.Include(r => r.User).Include(r => r.Dishes).
                FirstOrDefaultAsync(r => r.UserId == userId);
        }

        public async Task<bool> IsSlugUniqueAsync(string slug, Guid? excludeRestaurantId = null)
        {
            return!await _context.Restaurants
            .Where(v => v.RestaurantSlug == slug && (excludeRestaurantId == null || v.Id != excludeRestaurantId))
            .AnyAsync();
        }

        public async Task<List<Restaurant>> SearchRestaurantAsync(string searchTerm, int skip = 0, int take = 20)
        {
            return await _context.Restaurants
            .Include(r => r.User)
            .Where(r => r.IsActive &&
                   (r.RestaurantName.Contains(searchTerm) ||
                    r.RestaurantDescription != null && r.RestaurantDescription.Contains(searchTerm)))
            .OrderByDescending(r => r.AverageRating)
            .ThenByDescending(r => r.TotalSales)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
        }

        public async Task UpdateAsync(Restaurant restaurant)
        {
            restaurant.UpdatedAt = DateTime.UtcNow;
            _context.Restaurants.Update(restaurant);
            await _context.SaveChangesAsync();
        }
        public async Task<List<Restaurant>> GetAllAsync(int skip, int take)
        {
            return await _context.Restaurants
                .Include(r => r.User)
                .Include(r => r.Dishes)
                .OrderByDescending(r => r.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<int> GetTotalCountAsync()
        {
            return await _context.Restaurants.CountAsync();
        }
    }
}
