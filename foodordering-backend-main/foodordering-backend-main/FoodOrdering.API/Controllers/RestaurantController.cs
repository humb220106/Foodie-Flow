using FoodOrdering.Application.DTOs.Restaurant;
using FoodOrdering.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FoodOrdering.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RestaurantController : ControllerBase
    {
        private readonly IRestaurantService _restaurantService;
        private readonly ILogger<RestaurantController> _logger;

        public RestaurantController(IRestaurantService restaurantService, ILogger<RestaurantController> logger)
        {
            _restaurantService = restaurantService;
            _logger = logger;
        }

        [Authorize(Policy = "RestaurantOnly")]
        [HttpPost]
        [RequestSizeLimit(10_000_000)]
        public async Task<ActionResult<RestaurantResponse>> CreateVendor([FromForm] CreateRestaurantRequest request)
        {
            var userId = GetCurrentUserId();

            try
            {
                var restaurant = await _restaurantService.CreateRestaurantAsync(userId, request);
                _logger.LogInformation("User {UserId} created restaurant {RestaurantId}", userId, restaurant.Id);

                return CreatedAtAction(nameof(GetRestaurantById), new { id = restaurant.Id }, MapToResponse(restaurant));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create vendor store for user {UserId}", userId);
                return StatusCode(500, new { error = "An unexpected error occurred while creating the vendor store." });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<RestaurantResponse>> GetRestaurantById(Guid id)
        {
            try
            {
                var restaurant = await _restaurantService.GetRestaurantByIdAsync(id);
                return Ok(MapToResponse(restaurant));
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [Authorize(Policy = "RestaurantOnly")]
        [HttpGet("me")]
        public async Task<ActionResult<RestaurantResponse>> GetMyRestaurant()
        {
            var userId = GetCurrentUserId();

            try
            {
                var restaurant = await _restaurantService.GetRestaurantByUserIdAsync(userId);
                return Ok(MapToResponse(restaurant));
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = "You don't have a vendor store yet" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get restaurant for user {UserId}", userId);
                return StatusCode(500, new { error = "An unexpected error occurred while retrieving your restaurant." });
            }
        }

        [HttpGet("store/{slug}")]
        public async Task<ActionResult<RestaurantResponse>> GetRestaurantBySlug(string slug)
        {
            try
            {
                var restaurant = await _restaurantService.GetRestaurantBySlugAsync(slug);
                return Ok(MapToResponse(restaurant));
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [Authorize(Policy = "RestaurantOnly")]
        [HttpPut("{id}")]
        [RequestSizeLimit(10_000_000)]
        public async Task<ActionResult<RestaurantResponse>> UpdateVendor(Guid id, [FromForm] UpdateRestaurantRequest request)
        {
            var userId = GetCurrentUserId();

            try
            {
                var restaurant = await _restaurantService.UpdateRestaurantAsync(id, userId, request);
                _logger.LogInformation("User {UserId} updated restaurant {RestaurantId}", userId, restaurant.Id);

                return Ok(MapToResponse(restaurant));
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update restaurant {RestaurantId} for user {UserId}", id, userId);
                return StatusCode(500, new { error = "An unexpected error occurred while updating the restaurant." });
            }
        }

        [HttpGet("search")]
        public async Task<ActionResult<List<RestaurantResponse>>> SearchRestaurants([FromQuery] string q, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var searchTerm = q?.Trim();
            if (string.IsNullOrWhiteSpace(searchTerm))
            {
                return BadRequest(new { message = "Search query is required" });
            }

            try
            {
                var restaurants = await _restaurantService.SearchRestaurantsAsync(searchTerm, page, pageSize);
                var response = restaurants.Select(MapToResponse).ToList();
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to search restaurants with query {Query}", searchTerm);
                return StatusCode(500, new { error = "An unexpected error occurred while searching restaurants." });
            }
        }

        // Helper Methods
        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("User ID not found in token");
            }
            return userId;
        }

        private RestaurantResponse MapToResponse(FoodOrdering.Core.Entities.Restaurant restaurant) =>
            new RestaurantResponse(
                restaurant.Id,
                restaurant.UserId,
                restaurant.RestaurantName,
                restaurant.RestaurantSlug,
                restaurant.RestaurantDescription,
                restaurant.RestaurantLogo,
                restaurant.RestaurantBanner,
                restaurant.TotalSales,
                restaurant.AverageRating,
                restaurant.TotalReviews,
                restaurant.CreatedAt
            );
    }
}
