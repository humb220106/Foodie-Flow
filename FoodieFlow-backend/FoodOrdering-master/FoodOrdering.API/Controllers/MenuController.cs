// FoodOrdering.API.Controllers/MenuController.cs
using FoodOrdering.Application.DTOs.Menu;
using FoodOrdering.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace FoodOrdering.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MenuController : ControllerBase
    {
        private readonly IMenuService _menuService;
        private readonly IRestaurantService _restaurantService;
        private readonly ILogger<MenuController> _logger;

        public MenuController(
            IMenuService menuService,
            IRestaurantService restaurantService,
            ILogger<MenuController> logger)
        {
            _menuService = menuService;
            _restaurantService = restaurantService;
            _logger = logger;
        }

        // Create Menu (Restaurant only)
        [HttpPost]
        [Authorize(Policy = "RestaurantOnly")]
        public async Task<IActionResult> CreateMenu([FromBody] CreateMenuRequest request)
        {
            try
            {
                var restaurant = await GetUserRestaurant();
                if (restaurant == null)
                    return NotFound(new { message = "Restaurant not found for this user" });

                var menu = await _menuService.CreateMenuAsync(restaurant.Id, request);
                return CreatedAtAction(nameof(GetMenuById), new { id = menu.Id },
                    new { message = "Menu created successfully", data = menu });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating menu");
                return StatusCode(500, new { message = "An error occurred while creating the menu" });
            }
        }

        // Get Menu by ID (Public)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetMenuById(Guid id)
        {
            try
            {
                var menu = await _menuService.GetMenuByIdAsync(id);
                return Ok(new { data = menu });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving menu {MenuId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the menu" });
            }
        }

        // Get All Menus for a Restaurant (Public)
        [HttpGet("restaurant/{restaurantId}")]
        public async Task<IActionResult> GetRestaurantMenus(Guid restaurantId)
        {
            try
            {
                var menus = await _menuService.GetRestaurantMenusAsync(restaurantId);
                return Ok(new { data = menus, count = menus.Count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving menus for restaurant {RestaurantId}", restaurantId);
                return StatusCode(500, new { message = "An error occurred while retrieving menus" });
            }
        }

        // Get Default Menu for a Restaurant (Public)
        [HttpGet("restaurant/{restaurantId}/default")]
        public async Task<IActionResult> GetDefaultMenu(Guid restaurantId)
        {
            try
            {
                var menu = await _menuService.GetDefaultMenuAsync(restaurantId);
                return Ok(new { data = menu });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving default menu for restaurant {RestaurantId}", restaurantId);
                return StatusCode(500, new { message = "An error occurred while retrieving the default menu" });
            }
        }

        // Update Menu (Restaurant only)
        [HttpPut("{id}")]
        [Authorize(Roles = "RestaurantOnly")]
        public async Task<IActionResult> UpdateMenu(Guid id, [FromBody] UpdateMenuRequest request)
        {
            try
            {
                var restaurant = await GetUserRestaurant();
                if (restaurant == null)
                    return NotFound(new { message = "Restaurant not found for this user" });

                var menu = await _menuService.UpdateMenuAsync(id, restaurant.Id, request);
                return Ok(new { message = "Menu updated successfully", data = menu });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating menu {MenuId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the menu" });
            }
        }

        // Delete Menu (Restaurant only)
        [HttpDelete("{id}")]
        [Authorize(Roles = "RestaurantOnly")]
        public async Task<IActionResult> DeleteMenu(Guid id)
        {
            try
            {
                var restaurant = await GetUserRestaurant();
                if (restaurant == null)
                    return NotFound(new { message = "Restaurant not found for this user" });

                await _menuService.DeleteMenuAsync(id, restaurant.Id);
                return Ok(new { message = "Menu deleted successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting menu {MenuId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the menu" });
            }
        }

        // Add Section to Menu (Restaurant only)
        [HttpPost("{id}/sections")]
        [Authorize(Policy = "RestaurantOnly")]
        public async Task<IActionResult> AddSection(Guid id, [FromBody] CreateMenuSectionRequest request)
        {
            try
            {
                var restaurant = await GetUserRestaurant();
                if (restaurant == null)
                    return NotFound(new { message = "Restaurant not found for this user" });

                var menu = await _menuService.AddSectionAsync(id, restaurant.Id, request);
                return Ok(new { message = "Section added successfully", data = menu });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding section to menu {MenuId}", id);
                return StatusCode(500, new { message = "An error occurred while adding the section" });
            }
        }

        // Update Section (Restaurant only)
        [HttpPut("{id}/sections/{sectionId}")]
        [Authorize(Policy = "RestaurantOnly")]
        public async Task<IActionResult> UpdateSection(Guid id, Guid sectionId, [FromBody] UpdateMenuSectionRequest request)
        {
            try
            {
                var restaurant = await GetUserRestaurant();
                if (restaurant == null)
                    return NotFound(new { message = "Restaurant not found for this user" });

                var menu = await _menuService.UpdateSectionAsync(id, sectionId, restaurant.Id, request);
                return Ok(new { message = "Section updated successfully", data = menu });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating section {SectionId}", sectionId);
                return StatusCode(500, new { message = "An error occurred while updating the section" });
            }
        }

        // Delete Section (Restaurant only)
        [HttpDelete("{id}/sections/{sectionId}")]
        [Authorize(Policy = "RestaurantOnly")]
        public async Task<IActionResult> DeleteSection(Guid id, Guid sectionId)
        {
            try
            {
                var restaurant = await GetUserRestaurant();
                if (restaurant == null)
                    return NotFound(new { message = "Restaurant not found for this user" });

                await _menuService.DeleteSectionAsync(id, sectionId, restaurant.Id);
                return Ok(new { message = "Section deleted successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting section {SectionId}", sectionId);
                return StatusCode(500, new { message = "An error occurred while deleting the section" });
            }
        }

        // Add Dish to Section (Restaurant only)
        [HttpPost("{id}/sections/{sectionId}/dishes")]
        [Authorize(Policy = "RestaurantOnly")]
        public async Task<IActionResult> AddDishToSection(Guid id, Guid sectionId, [FromBody] MenuSectionDishRequest request)
        {
            try
            {
                var restaurant = await GetUserRestaurant();
                if (restaurant == null)
                    return NotFound(new { message = "Restaurant not found for this user" });

                var menu = await _menuService.AddDishToSectionAsync(id, sectionId, restaurant.Id, request);
                return Ok(new { message = "Dish added to section successfully", data = menu });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding dish to section {SectionId}", sectionId);
                return StatusCode(500, new { message = "An error occurred while adding the dish" });
            }
        }

        // Remove Dish from Section (Restaurant only)
        [HttpDelete("{id}/sections/{sectionId}/dishes/{dishId}")]
        [Authorize(Policy = "RestaurantOnly")]
        public async Task<IActionResult> RemoveDishFromSection(Guid id, Guid sectionId, Guid dishId)
        {
            try
            {
                var restaurant = await GetUserRestaurant();
                if (restaurant == null)
                    return NotFound(new { message = "Restaurant not found for this user" });

                var menu = await _menuService.RemoveDishFromSectionAsync(id, sectionId, dishId, restaurant.Id);
                return Ok(new { message = "Dish removed from section successfully", data = menu });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing dish {DishId} from section {SectionId}", dishId, sectionId);
                return StatusCode(500, new { message = "An error occurred while removing the dish" });
            }
        }

        // Helpers
        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                throw new UnauthorizedAccessException("User ID not found in token");
            return userId;
        }

        private async Task<FoodOrdering.Core.Entities.Restaurant?> GetUserRestaurant()
        {
            var userId = GetCurrentUserId();
            return await _restaurantService.GetRestaurantByUserIdAsync(userId);
        }
    }
}