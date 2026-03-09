// FoodOrdering.Infrastructure.Repositories/MenuRepository.cs
using FoodOrdering.Application.Repositories;
using FoodOrdering.Core.Entities;
using FoodOrdering.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FoodOrdering.Infrastructure.Repositories
{
    public class MenuRepository : IMenuRepository
    {
        private readonly AppDbContext _context;
        private readonly ILogger<MenuRepository> _logger;

        public MenuRepository(AppDbContext context, ILogger<MenuRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<Menu> CreateAsync(Menu menu)
        {
            try
            {
                await _context.Menus.AddAsync(menu);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Menu {MenuId} created", menu.Id);
                return menu;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating menu {MenuName}", menu.Name);
                throw;
            }
        }

        public async Task<Menu?> GetByIdAsync(Guid id)
        {
            try
            {
                return await _context.Menus
                    .Include(m => m.Restaurant)
                    .Include(m => m.Sections.OrderBy(s => s.DisplayOrder))
                        .ThenInclude(s => s.MenuSectionDishes.OrderBy(d => d.DisplayOrder))
                            .ThenInclude(d => d.Dish)
                    .FirstOrDefaultAsync(m => m.Id == id && m.IsActive);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving menu {MenuId}", id);
                throw;
            }
        }

        public async Task<List<Menu>> GetByRestaurantIdAsync(Guid restaurantId)
        {
            try
            {
                return await _context.Menus
                    .Include(m => m.Restaurant)
                    .Include(m => m.Sections.OrderBy(s => s.DisplayOrder))
                        .ThenInclude(s => s.MenuSectionDishes.OrderBy(d => d.DisplayOrder))
                            .ThenInclude(d => d.Dish)
                    .Where(m => m.RestaurantId == restaurantId && m.IsActive)
                    .OrderByDescending(m => m.IsDefault)
                    .ThenByDescending(m => m.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving menus for restaurant {RestaurantId}", restaurantId);
                throw;
            }
        }

        public async Task<Menu?> GetDefaultMenuAsync(Guid restaurantId)
        {
            try
            {
                return await _context.Menus
                    .Include(m => m.Restaurant)
                    .Include(m => m.Sections.OrderBy(s => s.DisplayOrder))
                        .ThenInclude(s => s.MenuSectionDishes.OrderBy(d => d.DisplayOrder))
                            .ThenInclude(d => d.Dish)
                    .FirstOrDefaultAsync(m =>
                        m.RestaurantId == restaurantId &&
                        m.IsDefault &&
                        m.IsActive);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving default menu for restaurant {RestaurantId}", restaurantId);
                throw;
            }
        }

        public async Task UpdateAsync(Menu menu)
        {
            try
            {
                _context.Menus.Update(menu);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Menu {MenuId} updated", menu.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating menu {MenuId}", menu.Id);
                throw;
            }
        }

        public async Task<MenuSection> CreateSectionAsync(MenuSection section)
        {
            try
            {
                await _context.MenuSections.AddAsync(section);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Section {SectionId} created for menu {MenuId}", section.Id, section.MenuId);
                return section;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating section {SectionName}", section.Name);
                throw;
            }
        }

        public async Task<MenuSection?> GetSectionByIdAsync(Guid sectionId)
        {
            try
            {
                return await _context.MenuSections
                    .Include(s => s.MenuSectionDishes)
                        .ThenInclude(d => d.Dish)
                    .FirstOrDefaultAsync(s => s.Id == sectionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving section {SectionId}", sectionId);
                throw;
            }
        }

        public async Task UpdateSectionAsync(MenuSection section)
        {
            try
            {
                _context.MenuSections.Update(section);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Section {SectionId} updated", section.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating section {SectionId}", section.Id);
                throw;
            }
        }

        public async Task DeleteSectionAsync(Guid sectionId)
        {
            try
            {
                // Remove all dishes in the section first to respect FK constraints
                var dishes = await _context.MenuSectionDishes
                    .Where(d => d.MenuSectionId == sectionId)
                    .ToListAsync();

                if (dishes.Any())
                    _context.MenuSectionDishes.RemoveRange(dishes);

                var section = await _context.MenuSections.FindAsync(sectionId);
                if (section != null)
                    _context.MenuSections.Remove(section);

                await _context.SaveChangesAsync();
                _logger.LogInformation("Section {SectionId} deleted", sectionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting section {SectionId}", sectionId);
                throw;
            }
        }

        public async Task AddDishToSectionAsync(MenuSectionDish menuSectionDish)
        {
            try
            {
                await _context.MenuSectionDishes.AddAsync(menuSectionDish);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Dish {DishId} added to section {SectionId}",
                    menuSectionDish.DishId, menuSectionDish.MenuSectionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding dish {DishId} to section {SectionId}",
                    menuSectionDish.DishId, menuSectionDish.MenuSectionId);
                throw;
            }
        }

        public async Task RemoveDishFromSectionAsync(Guid sectionId, Guid dishId)
        {
            try
            {
                var entry = await _context.MenuSectionDishes
                    .FirstOrDefaultAsync(d => d.MenuSectionId == sectionId && d.DishId == dishId);

                if (entry != null)
                {
                    _context.MenuSectionDishes.Remove(entry);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Dish {DishId} removed from section {SectionId}", dishId, sectionId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing dish {DishId} from section {SectionId}", dishId, sectionId);
                throw;
            }
        }

        public async Task<bool> DishExistsInSectionAsync(Guid sectionId, Guid dishId)
        {
            try
            {
                return await _context.MenuSectionDishes
                    .AnyAsync(d => d.MenuSectionId == sectionId && d.DishId == dishId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking dish {DishId} in section {SectionId}", dishId, sectionId);
                throw;
            }
        }

        public async Task ClearDefaultMenuAsync(Guid restaurantId)
        {
            try
            {
                await _context.Menus
                    .Where(m => m.RestaurantId == restaurantId && m.IsDefault)
                    .ExecuteUpdateAsync(s => s.SetProperty(m => m.IsDefault, false));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error clearing default menu for restaurant {RestaurantId}", restaurantId);
                throw;
            }
        }
    }
}