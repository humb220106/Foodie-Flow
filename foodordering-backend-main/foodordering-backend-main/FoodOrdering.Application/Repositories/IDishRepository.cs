using FoodOrdering.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.Repositories
{
    public interface IDishRepository
    {
        Task<Dish?> GetByIdAsync(Guid id);
        Task<Dish?> GetBySlugAsync(string slug);
        Task<List<Dish>> GetAllAsync(int skip = 0, int take = 20);
        Task<List<Dish>> GetByRestaurantIdAsync(Guid RestaurantId, int skip = 0, int take = 20);
       
        Task<List<Dish>> GetByCategoryIdAsync(Guid categoryId, int skip = 0, int take = 20);
       
        
        Task<List<Dish>> SearchAsync(string searchTerm, Guid? categoryId = null, decimal? minPrice = null, decimal? maxPrice = null, int skip = 0, int take = 20);
        Task<Dish> CreateAsync(Dish dish);
        Task UpdateAsync(Dish dish);
        Task DeleteAsync(Guid id);
        Task<bool> IsSlugUniqueAsync(string slug, Guid? excludeProductId = null);
        Task IncrementViewCountAsync(Guid dishId);
        Task<int> GetTotalCountAsync();
        Task<Dish> GetByIdWithLockAsync(Guid id);
    }
}
