// FoodOrdering.Application.Services/MenuService.cs
using FoodOrdering.Application.DTOs.Menu;
using FoodOrdering.Application.Interfaces;
using FoodOrdering.Application.Repositories;
using FoodOrdering.Core.Entities;
using FoodOrdering.Core.Enums;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FoodOrdering.Application.Services
{
    public class MenuService : IMenuService
    {
        private readonly IMenuRepository _menuRepository;
        private readonly IRestaurantRepository _restaurantRepository;
        private readonly IDishRepository _dishRepository;
        private readonly IAuditLogRepository _auditLogRepository;
        private readonly ILogger<MenuService> _logger;

        public MenuService(
            IMenuRepository menuRepository,
            IRestaurantRepository restaurantRepository,
            IDishRepository dishRepository,
            IAuditLogRepository auditLogRepository,
            ILogger<MenuService> logger)
        {
            _menuRepository = menuRepository;
            _restaurantRepository = restaurantRepository;
            _dishRepository = dishRepository;
            _auditLogRepository = auditLogRepository;
            _logger = logger;
        }

        public async Task<MenuResponse> CreateMenuAsync(Guid restaurantId, CreateMenuRequest request)
        {
            var restaurant = await _restaurantRepository.GetByIdAsync(restaurantId);
            if (restaurant == null)
                throw new InvalidOperationException("Restaurant not found.");

            // If this menu is set as default, clear the existing default first
            if (request.IsDefault)
                await _menuRepository.ClearDefaultMenuAsync(restaurantId);

            var menu = new Menu
            {
                Id = Guid.NewGuid(),
                RestaurantId = restaurantId,
                Name = request.Name,
                Description = request.Description,
                IsDefault = request.IsDefault,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _menuRepository.CreateAsync(menu);

            // Create sections and their dishes
            foreach (var sectionRequest in request.Sections)
                await CreateSectionInternal(created.Id, sectionRequest);

            // Reload with sections
            var full = await _menuRepository.GetByIdAsync(created.Id);
            await LogAuditAsync(restaurant.UserId, "Menu Created", $"Menu: {request.Name}", "System", true);
            _logger.LogInformation("Menu {MenuName} created for restaurant {RestaurantId}", request.Name, restaurantId);

            return MapToMenuResponse(full!);
        }

        public async Task<MenuResponse> GetMenuByIdAsync(Guid menuId)
        {
            var menu = await _menuRepository.GetByIdAsync(menuId);
            if (menu == null || !menu.IsActive)
                throw new InvalidOperationException("Menu not found.");

            return MapToMenuResponse(menu);
        }

        public async Task<List<MenuSummaryResponse>> GetRestaurantMenusAsync(Guid restaurantId)
        {
            var menus = await _menuRepository.GetByRestaurantIdAsync(restaurantId);
            return menus.Select(MapToMenuSummary).ToList();
        }

        public async Task<MenuResponse> GetDefaultMenuAsync(Guid restaurantId)
        {
            var menu = await _menuRepository.GetDefaultMenuAsync(restaurantId);
            if (menu == null)
                throw new InvalidOperationException("No default menu found for this restaurant.");

            return MapToMenuResponse(menu);
        }

        public async Task<MenuResponse> UpdateMenuAsync(Guid menuId, Guid restaurantId, UpdateMenuRequest request)
        {
            var menu = await GetAndAuthorizeMenu(menuId, restaurantId);

            if (!string.IsNullOrWhiteSpace(request.Name))
                menu.Name = request.Name;

            if (request.Description != null)
                menu.Description = request.Description;

            if (request.IsActive.HasValue)
                menu.IsActive = request.IsActive.Value;

            if (request.IsDefault.HasValue && request.IsDefault.Value && !menu.IsDefault)
            {
                await _menuRepository.ClearDefaultMenuAsync(restaurantId);
                menu.IsDefault = true;
            }

            menu.UpdatedAt = DateTime.UtcNow;
            await _menuRepository.UpdateAsync(menu);

            var restaurant = await _restaurantRepository.GetByIdAsync(restaurantId);
            await LogAuditAsync(restaurant!.UserId, "Menu Updated", $"Menu: {menu.Name} (ID: {menuId})", "System", true);
            _logger.LogInformation("Menu {MenuId} updated for restaurant {RestaurantId}", menuId, restaurantId);

            return MapToMenuResponse(menu);
        }

        public async Task DeleteMenuAsync(Guid menuId, Guid restaurantId)
        {
            var menu = await GetAndAuthorizeMenu(menuId, restaurantId);

            menu.IsActive = false;
            menu.UpdatedAt = DateTime.UtcNow;
            await _menuRepository.UpdateAsync(menu);

            var restaurant = await _restaurantRepository.GetByIdAsync(restaurantId);
            await LogAuditAsync(restaurant!.UserId, "Menu Deleted", $"Menu: {menu.Name} (ID: {menuId})", "System", true);
            _logger.LogInformation("Menu {MenuId} deleted for restaurant {RestaurantId}", menuId, restaurantId);
        }

        public async Task<MenuResponse> AddSectionAsync(Guid menuId, Guid restaurantId, CreateMenuSectionRequest request)
        {
            var menu = await GetAndAuthorizeMenu(menuId, restaurantId);

            await CreateSectionInternal(menuId, request);

            var updated = await _menuRepository.GetByIdAsync(menuId);
            return MapToMenuResponse(updated!);
        }

        public async Task<MenuResponse> UpdateSectionAsync(Guid menuId, Guid sectionId, Guid restaurantId, UpdateMenuSectionRequest request)
        {
            await GetAndAuthorizeMenu(menuId, restaurantId);

            var section = await _menuRepository.GetSectionByIdAsync(sectionId);
            if (section == null || section.MenuId != menuId)
                throw new InvalidOperationException("Section not found.");

            if (!string.IsNullOrWhiteSpace(request.Name))
                section.Name = request.Name;

            if (request.Description != null)
                section.Description = request.Description;

            if (request.DisplayOrder.HasValue)
                section.DisplayOrder = request.DisplayOrder.Value;

            section.UpdatedAt = DateTime.UtcNow;
            await _menuRepository.UpdateSectionAsync(section);

            var updated = await _menuRepository.GetByIdAsync(menuId);
            return MapToMenuResponse(updated!);
        }

        public async Task DeleteSectionAsync(Guid menuId, Guid sectionId, Guid restaurantId)
        {
            await GetAndAuthorizeMenu(menuId, restaurantId);

            var section = await _menuRepository.GetSectionByIdAsync(sectionId);
            if (section == null || section.MenuId != menuId)
                throw new InvalidOperationException("Section not found.");

            await _menuRepository.DeleteSectionAsync(sectionId);
            _logger.LogInformation("Section {SectionId} deleted from menu {MenuId}", sectionId, menuId);
        }

        public async Task<MenuResponse> AddDishToSectionAsync(Guid menuId, Guid sectionId, Guid restaurantId, MenuSectionDishRequest request)
        {
            await GetAndAuthorizeMenu(menuId, restaurantId);

            var section = await _menuRepository.GetSectionByIdAsync(sectionId);
            if (section == null || section.MenuId != menuId)
                throw new InvalidOperationException("Section not found.");

            var dish = await _dishRepository.GetByIdAsync(request.DishId);
            if (dish == null || !dish.IsActive)
                throw new InvalidOperationException("Dish not found.");

            if (dish.RestaurantId != restaurantId)
                throw new InvalidOperationException("Dish does not belong to this restaurant.");

            if (await _menuRepository.DishExistsInSectionAsync(sectionId, request.DishId))
                throw new InvalidOperationException("Dish is already in this section.");

            await _menuRepository.AddDishToSectionAsync(new MenuSectionDish
            {
                Id = Guid.NewGuid(),
                MenuSectionId = sectionId,
                DishId = request.DishId,
                DisplayOrder = request.DisplayOrder
            });

            var updated = await _menuRepository.GetByIdAsync(menuId);
            return MapToMenuResponse(updated!);
        }

        public async Task<MenuResponse> RemoveDishFromSectionAsync(Guid menuId, Guid sectionId, Guid dishId, Guid restaurantId)
        {
            await GetAndAuthorizeMenu(menuId, restaurantId);

            var section = await _menuRepository.GetSectionByIdAsync(sectionId);
            if (section == null || section.MenuId != menuId)
                throw new InvalidOperationException("Section not found.");

            await _menuRepository.RemoveDishFromSectionAsync(sectionId, dishId);

            var updated = await _menuRepository.GetByIdAsync(menuId);
            return MapToMenuResponse(updated!);
        }

        // ── Helpers ──────────────────────────────────────────────────

        private async Task<Menu> GetAndAuthorizeMenu(Guid menuId, Guid restaurantId)
        {
            var menu = await _menuRepository.GetByIdAsync(menuId);
            if (menu == null || !menu.IsActive)
                throw new InvalidOperationException("Menu not found.");

            if (menu.RestaurantId != restaurantId)
                throw new UnauthorizedAccessException("You don't have permission to modify this menu.");

            return menu;
        }

        private async Task CreateSectionInternal(Guid menuId, CreateMenuSectionRequest sectionRequest)
        {
            var section = new MenuSection
            {
                Id = Guid.NewGuid(),
                MenuId = menuId,
                Name = sectionRequest.Name,
                Description = sectionRequest.Description,
                DisplayOrder = sectionRequest.DisplayOrder,
                CreatedAt = DateTime.UtcNow
            };

            var createdSection = await _menuRepository.CreateSectionAsync(section);

            foreach (var dishRequest in sectionRequest.Dishes)
            {
                await _menuRepository.AddDishToSectionAsync(new MenuSectionDish
                {
                    Id = Guid.NewGuid(),
                    MenuSectionId = createdSection.Id,
                    DishId = dishRequest.DishId,
                    DisplayOrder = dishRequest.DisplayOrder
                });
            }
        }

        private MenuResponse MapToMenuResponse(Menu menu) => new()
        {
            Id = menu.Id,
            RestaurantId = menu.RestaurantId,
            RestaurantName = menu.Restaurant?.RestaurantName ?? "Unknown",
            Name = menu.Name,
            Description = menu.Description,
            IsDefault = menu.IsDefault,
            IsActive = menu.IsActive,
            CreatedAt = menu.CreatedAt,
            UpdatedAt = menu.UpdatedAt,
            Sections = menu.Sections.OrderBy(s => s.DisplayOrder).Select(s => new MenuSectionResponse
            {
                Id = s.Id,
                Name = s.Name,
                Description = s.Description,
                DisplayOrder = s.DisplayOrder,
                Dishes = s.MenuSectionDishes.OrderBy(d => d.DisplayOrder).Select(d => new MenuSectionDishResponse
                {
                    DishId = d.DishId,
                    DishName = d.Dish?.Title ?? "Unknown",
                    DishImage = d.Dish?.PrimaryImage,
                    Price = d.Dish?.Price ?? 0,
                    IsAvailable = d.Dish?.IsAvailable ?? false,
                    DisplayOrder = d.DisplayOrder
                }).ToList()
            }).ToList()
        };

        private MenuSummaryResponse MapToMenuSummary(Menu menu) => new()
        {
            Id = menu.Id,
            Name = menu.Name,
            Description = menu.Description,
            IsDefault = menu.IsDefault,
            IsActive = menu.IsActive,
            SectionCount = menu.Sections?.Count ?? 0,
            CreatedAt = menu.CreatedAt
        };

        private async Task LogAuditAsync(Guid userId, string action, string details, string ipAddress, bool isSuccess)
        {
            await _auditLogRepository.CreateAsync(new Core.Entities.AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Action = action,
                Details = details,
                IpAddress = ipAddress,
                CreatedAt = DateTime.UtcNow,
                IsSuccess = isSuccess
            });
        }
    }
}