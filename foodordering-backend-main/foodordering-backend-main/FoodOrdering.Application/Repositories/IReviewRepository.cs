using FoodOrdering.Core.Entities;

namespace FoodOrdering.Application.Repositories
{
    public interface IReviewRepository
    {
        Task<Review> CreateAsync(Review review);
        Task<Review?> GetByIdAsync(Guid id);
        Task<Review?> GetByAuthorAndDishAsync(Guid authorId, Guid dishId);
        Task<Review?> GetByAuthorAndRestaurantAsync(Guid authorId, Guid restaurantId);
        Task<List<Review>> GetByDishIdAsync(Guid dishId, int skip, int take);
        Task<List<Review>> GetByRestaurantIdAsync(Guid restaurantId, int skip, int take);
        Task<List<Review>> GetByAuthorIdAsync(Guid authorId, int skip, int take);
        Task<int> GetCountByDishIdAsync(Guid dishId);
        Task<int> GetCountByRestaurantIdAsync(Guid restaurantId);
        Task<double> GetAverageRatingByDishIdAsync(Guid dishId);
        Task<double> GetAverageRatingByRestaurantIdAsync(Guid restaurantId);
        Task<Dictionary<int, int>> GetRatingDistributionByDishIdAsync(Guid dishId);
        Task<Dictionary<int, int>> GetRatingDistributionByRestaurantIdAsync(Guid restaurantId);
        Task UpdateAsync(Review review);
        Task DeleteAsync(Guid id);
        Task<bool> HasUserOrderedDishAsync(Guid userId, Guid dishId);
        Task<bool> HasUserOrderedFromRestaurantAsync(Guid userId, Guid restaurantId);
        Task<List<Review>> GetAllAsync(int skip, int take);
        Task<int> GetTotalCountAsync();
    }
}