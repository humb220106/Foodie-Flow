using FoodOrdering.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.Repositories
{
    public interface IMenuRepository
    {
        Task<Menu> CreateAsync(Menu menu);
        Task<Menu?> GetByIdAsync(Guid id);
        Task<List<Menu>> GetByRestaurantIdAsync(Guid restaurantId);
        Task<Menu?> GetDefaultMenuAsync(Guid restaurantId);
        Task UpdateAsync(Menu menu);
        Task<MenuSection> CreateSectionAsync(MenuSection section);
        Task<MenuSection?> GetSectionByIdAsync(Guid sectionId);
        Task UpdateSectionAsync(MenuSection section);
        Task DeleteSectionAsync(Guid sectionId);
        Task AddDishToSectionAsync(MenuSectionDish menuSectionDish);
        Task RemoveDishFromSectionAsync(Guid sectionId, Guid dishId);
        Task<bool> DishExistsInSectionAsync(Guid sectionId, Guid dishId);
        Task ClearDefaultMenuAsync(Guid restaurantId);
    }
}
