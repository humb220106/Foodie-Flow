using FoodOrdering.Application.DTOs.Dish;
using FoodOrdering.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.Interfaces
{
    public interface IDishService
    {
        Task<Dish> CreateDishAsync(Guid ResturantId, CreateDishRequest  request);
        Task<Dish> GetDishByIdAsync(Guid id);
        Task<Dish> GetDishBySlugAsync(string slug);
        Task<Dish> UpdateDishAsync(Guid dishId, Guid restaurantId, UpdateDishRequest request);
        Task DeleteDishAsync(Guid productId, Guid sellerId);
       
        Task<List<Dish>> GetRestaurantDishesAsync(Guid restaurantId, int page = 1, int pageSize = 20);
        
       
        Task<List<Dish>> SearchDishesAsync(string searchTerm, Guid? categoryId = null, decimal? minPrice = null, decimal? maxPrice = null, int page = 1, int pageSize = 20);
        Task IncrementDishViewAsync(Guid dishId);
    }
}
