using FoodOrdering.Application.Repositories;
using FoodOrdering.Core.Entities;
using FoodOrdering.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FoodOrdering.Infrastructure.Repositories
{
    public class ReviewRepository : IReviewRepository
    {
        private readonly AppDbContext _context;

        public ReviewRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Review> CreateAsync(Review review)
        {
            await _context.Reviews.AddAsync(review);
            await _context.SaveChangesAsync();
            return review;
        }

        public async Task<Review?> GetByIdAsync(Guid id)
        {
            return await _context.Reviews
                .Include(r => r.Author)
                .Include(r => r.Dish)
                .Include(r => r.Restaurant)
                .FirstOrDefaultAsync(r => r.Id == id && r.IsActive);
        }

        public async Task<Review?> GetByAuthorAndDishAsync(Guid authorId, Guid dishId)
        {
            return await _context.Reviews
                .FirstOrDefaultAsync(r => r.AuthorId == authorId && r.DishId == dishId && r.IsActive);
        }

        public async Task<Review?> GetByAuthorAndRestaurantAsync(Guid authorId, Guid restaurantId)
        {
            return await _context.Reviews
                .FirstOrDefaultAsync(r => r.AuthorId == authorId && r.RestaurantId == restaurantId && r.IsActive);
        }

        public async Task<List<Review>> GetByDishIdAsync(Guid dishId, int skip, int take)
        {
            return await _context.Reviews
                .Include(r => r.Author)
                .Where(r => r.DishId == dishId && r.IsActive && r.Status == Core.Enums.ReviewStatus.Published)
                .OrderByDescending(r => r.IsVerifiedPurchase)
                .ThenByDescending(r => r.HelpfulCount)
                .ThenByDescending(r => r.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<List<Review>> GetByRestaurantIdAsync(Guid restaurantId, int skip, int take)
        {
            return await _context.Reviews
                .Include(r => r.Author)
                .Where(r => r.RestaurantId == restaurantId && r.IsActive && r.Status == Core.Enums.ReviewStatus.Published)
                .OrderByDescending(r => r.IsVerifiedPurchase)
                .ThenByDescending(r => r.HelpfulCount)
                .ThenByDescending(r => r.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<List<Review>> GetByAuthorIdAsync(Guid authorId, int skip, int take)
        {
            return await _context.Reviews
                .Include(r => r.Dish)
                .Include(r => r.Restaurant)
                .Where(r => r.AuthorId == authorId && r.IsActive)
                .OrderByDescending(r => r.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<int> GetCountByDishIdAsync(Guid dishId)
        {
            return await _context.Reviews
                .CountAsync(r => r.DishId == dishId && r.IsActive && r.Status == Core.Enums.ReviewStatus.Published);
        }

        public async Task<int> GetCountByRestaurantIdAsync(Guid restaurantId)
        {
            return await _context.Reviews
                .CountAsync(r => r.RestaurantId == restaurantId && r.IsActive && r.Status == Core.Enums.ReviewStatus.Published);
        }

        public async Task<double> GetAverageRatingByDishIdAsync(Guid dishId)
        {
            var reviews = await _context.Reviews
                .Where(r => r.DishId == dishId && r.IsActive && r.Status == Core.Enums.ReviewStatus.Published)
                .ToListAsync();

            return reviews.Any() ? reviews.Average(r => r.Rating) : 0;
        }

        public async Task<double> GetAverageRatingByRestaurantIdAsync(Guid restaurantId)
        {
            var reviews = await _context.Reviews
                .Where(r => r.RestaurantId == restaurantId && r.IsActive && r.Status == Core.Enums.ReviewStatus.Published)
                .ToListAsync();

            return reviews.Any() ? reviews.Average(r => r.Rating) : 0;
        }

        public async Task<Dictionary<int, int>> GetRatingDistributionByDishIdAsync(Guid dishId)
        {
            var distribution = await _context.Reviews
                .Where(r => r.DishId == dishId && r.IsActive && r.Status == Core.Enums.ReviewStatus.Published)
                .GroupBy(r => r.Rating)
                .Select(g => new { Rating = g.Key, Count = g.Count() })
                .ToListAsync();

            // Ensure all ratings 1–5 are present even if count is 0
            return Enumerable.Range(1, 5)
                .ToDictionary(
                    i => i,
                    i => distribution.FirstOrDefault(d => d.Rating == i)?.Count ?? 0
                );
        }

        public async Task<Dictionary<int, int>> GetRatingDistributionByRestaurantIdAsync(Guid restaurantId)
        {
            var distribution = await _context.Reviews
                .Where(r => r.RestaurantId == restaurantId && r.IsActive && r.Status == Core.Enums.ReviewStatus.Published)
                .GroupBy(r => r.Rating)
                .Select(g => new { Rating = g.Key, Count = g.Count() })
                .ToListAsync();

            return Enumerable.Range(1, 5)
                .ToDictionary(
                    i => i,
                    i => distribution.FirstOrDefault(d => d.Rating == i)?.Count ?? 0
                );
        }

        public async Task UpdateAsync(Review review)
        {
            review.UpdatedAt = DateTime.UtcNow;
            _context.Reviews.Update(review);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var review = await _context.Reviews.FindAsync(id);
            if (review != null)
            {
                // Soft delete
                review.IsActive = false;
                review.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> HasUserOrderedDishAsync(Guid userId, Guid dishId)
        {
            return await _context.Orders
                .AnyAsync(o => o.CustomerId == userId &&
                               o.Status == Core.Enums.OrderStatus.Delivered &&
                               o.OrderItems.Any(i => i.DishId == dishId));
        }

        public async Task<bool> HasUserOrderedFromRestaurantAsync(Guid userId, Guid restaurantId)
        {
            return await _context.Orders
                .AnyAsync(o => o.CustomerId == userId &&
                               o.RestaurantId == restaurantId &&
                               o.Status == Core.Enums.OrderStatus.Delivered);
        }
        public async Task<List<Review>> GetAllAsync(int skip, int take)
        {
            return await _context.Reviews
                .Include(r => r.Author)
                .Include(r => r.Dish)
                .Include(r => r.Restaurant)
                .Where(r => r.IsActive)
                .OrderByDescending(r => r.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<int> GetTotalCountAsync()
        {
            return await _context.Reviews.CountAsync(r => r.IsActive);
        }
    }
}