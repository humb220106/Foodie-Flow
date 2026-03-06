using FoodOrdering.Application.DTOs.Restaurant;
using FoodOrdering.Core.Entities;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.Interfaces
{
    public interface IRestaurantService
    {
        Task<Restaurant> CreateRestaurantAsync(Guid userId, CreateRestaurantRequest request);
        Task<Restaurant> GetRestaurantByIdAsync(Guid id);
        Task<Restaurant?> GetRestaurantByUserIdAsync(Guid userId);
        Task<Restaurant> GetRestaurantBySlugAsync(string slug);
        Task<Restaurant> UpdateRestaurantAsync(Guid restaurantId, Guid userId, UpdateRestaurantRequest request);
        Task<List<Restaurant>> SearchRestaurantsAsync(string searchTerm, int page = 1, int pageSize = 20);
    }
}
