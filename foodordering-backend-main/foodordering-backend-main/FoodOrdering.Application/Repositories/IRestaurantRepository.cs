using FoodOrdering.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.Repositories
{
    public interface IRestaurantRepository
    {
        Task<Restaurant?> GetByIdAsync(Guid id);
        Task<Restaurant?> GetByUserIdAsync(Guid userId);
        Task<Restaurant?> GetBySlugAsync(string slug);
        Task<List<Restaurant>> SearchRestaurantAsync(string searchTerm, int skip = 0, int take = 20);
        Task<Restaurant> CreateAsync(Restaurant restaurant);
        Task UpdateAsync(Restaurant restaurant);
        Task<bool> IsSlugUniqueAsync(string slug, Guid? excludeRestaurantId = null);
        Task<List<Restaurant>> GetAllAsync(int skip, int take);
        Task<int> GetTotalCountAsync();
    }
}
