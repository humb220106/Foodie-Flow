using FoodOrdering.Application.DTOs.Dish;
using FoodOrdering.Application.Interfaces;
using FoodOrdering.Core.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace FoodOrdering.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DishController : ControllerBase
    {
        private readonly IDishService _dishService;
        private readonly IRestaurantService _restaurantService;
        private readonly ILogger<DishController> _logger;

        public DishController(
            IDishService dishService,
            IRestaurantService restaurantService,
            ILogger<DishController> logger)
        {
            _dishService = dishService;
            _restaurantService = restaurantService;
            _logger = logger;
        }

        [HttpPost]
        [Authorize(Policy = "RestaurantOnly")]
        public async Task<IActionResult> CreateDish([FromForm] CreateDishRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();

                var restaurant = await _restaurantService.GetRestaurantByUserIdAsync(userId);
                if (restaurant == null)
                    return NotFound(new { message = "Restaurant not found for this user" });

                var dish = await _dishService.CreateDishAsync(restaurant.Id, request);

                return CreatedAtAction(
                    nameof(GetDishById),
                    new { id = dish.Id },
                    new { message = "Dish created successfully", data = MapToDishResponse(dish) }
                );
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Failed to create dish");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating dish");
                return StatusCode(500, new { message = "An error occurred while creating the dish" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDishById(Guid id)
        {
            try
            {
                var dish = await _dishService.GetDishByIdAsync(id);

                _ = _dishService.IncrementDishViewAsync(id);

                return Ok(new { data = MapToDishResponse(dish) });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving dish {DishId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the dish" });
            }
        }

        [HttpGet("slug/{slug}")]
        public async Task<IActionResult> GetDishBySlug(string slug)
        {
            try
            {
                var dish = await _dishService.GetDishBySlugAsync(slug);

                _ = _dishService.IncrementDishViewAsync(dish.Id);

                return Ok(new { data = MapToDishResponse(dish) });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving dish by slug {Slug}", slug);
                return StatusCode(500, new { message = "An error occurred while retrieving the dish" });
            }
        }

        [HttpGet("restaurant/{restaurantId}")]
        public async Task<IActionResult> GetRestaurantDishes(
            Guid restaurantId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 20;

                var dishes = await _dishService.GetRestaurantDishesAsync(restaurantId, page, pageSize);

                var response = dishes.Select(MapToDishResponse);

                return Ok(new
                {
                    data = response,
                    page,
                    pageSize,
                    count = dishes.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving dishes for restaurant {RestaurantId}", restaurantId);
                return StatusCode(500, new { message = "An error occurred while retrieving dishes" });
            }
        }

        [HttpGet("my-dishes")]
        [Authorize(Policy = "RestaurantOnly")]
        public async Task<IActionResult> GetMyDishes(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var userId = GetCurrentUserId();
                var restaurant = await _restaurantService.GetRestaurantByUserIdAsync(userId);

                if (restaurant == null)
                    return NotFound(new { message = "Restaurant not found for this user" });

                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 20;

                var dishes = await _dishService.GetRestaurantDishesAsync(restaurant.Id, page, pageSize);

                var response = dishes.Select(MapToDishResponse);

                return Ok(new
                {
                    data = response,
                    page,
                    pageSize,
                    count = dishes.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving dishes for current user");
                return StatusCode(500, new { message = "An error occurred while retrieving your dishes" });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "RestaurantOnly")]
        public async Task<IActionResult> UpdateDish(Guid id, [FromForm] UpdateDishRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var restaurant = await _restaurantService.GetRestaurantByUserIdAsync(userId);

                if (restaurant == null)
                    return NotFound(new { message = "Restaurant not found for this user" });

                var dish = await _dishService.UpdateDishAsync(id, restaurant.Id, request);

                return Ok(new
                {
                    message = "Dish updated successfully",
                    data = MapToDishResponse(dish)
                });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Failed to update dish {DishId}", id);
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating dish {DishId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the dish" });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "RestaurantOnly")]
        public async Task<IActionResult> DeleteDish(Guid id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var restaurant = await _restaurantService.GetRestaurantByUserIdAsync(userId);

                if (restaurant == null)
                    return NotFound(new { message = "Restaurant not found for this user" });

                await _dishService.DeleteDishAsync(id, restaurant.Id);

                return Ok(new { message = "Dish deleted successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting dish {DishId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the dish" });
            }
        }

        private static DishResponse MapToDishResponse(Dish dish)
        {
            return new DishResponse(
                dish.Id,
                dish.RestaurantId,
                dish.Restaurant.RestaurantName ?? string.Empty,
                dish.Title,
                dish.Slug,
                dish.Description,
                dish.ShortDescription,
                dish.Price,
                dish.IsAvailable,
                dish.CategoryId,
                dish.Category?.Name ?? string.Empty,
                dish.Tags,
                dish.PrimaryImage,
                dish.Images != null ? new List<string> { dish.Images } : null,
                dish.VideoUrl,
                dish.Status.ToString(),
                dish.IsActive,
                dish.IsFeatured,
                dish.ViewCount,
                dish.FavoriteCount,
                dish.AverageRating,
                dish.ReviewCount,
                dish.CreatedAt
            );
        }

        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                throw new UnauthorizedAccessException("User ID not found in token");

            return userId;
        }
    }
}
