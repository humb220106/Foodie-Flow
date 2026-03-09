using FoodOrdering.Application.DTOs.Menu;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.Interfaces
{
    public interface IMenuService
    {
        Task<MenuResponse> CreateMenuAsync(Guid restaurantId, CreateMenuRequest request);
        Task<MenuResponse> GetMenuByIdAsync(Guid menuId);
        Task<List<MenuSummaryResponse>> GetRestaurantMenusAsync(Guid restaurantId);
        Task<MenuResponse> GetDefaultMenuAsync(Guid restaurantId);
        Task<MenuResponse> UpdateMenuAsync(Guid menuId, Guid restaurantId, UpdateMenuRequest request);
        Task DeleteMenuAsync(Guid menuId, Guid restaurantId);
        Task<MenuResponse> AddSectionAsync(Guid menuId, Guid restaurantId, CreateMenuSectionRequest request);
        Task<MenuResponse> UpdateSectionAsync(Guid menuId, Guid sectionId, Guid restaurantId, UpdateMenuSectionRequest request);
        Task DeleteSectionAsync(Guid menuId, Guid sectionId, Guid restaurantId);
        Task<MenuResponse> AddDishToSectionAsync(Guid menuId, Guid sectionId, Guid restaurantId, MenuSectionDishRequest request);
        Task<MenuResponse> RemoveDishFromSectionAsync(Guid menuId, Guid sectionId, Guid dishId, Guid restaurantId);
    }
}
