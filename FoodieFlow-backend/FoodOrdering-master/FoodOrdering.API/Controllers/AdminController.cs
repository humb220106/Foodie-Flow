using FoodOrdering.Application.DTOs.Admin;
using FoodOrdering.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FoodOrdering.API.Controllers
{
    [Route("api/admin")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;
        private readonly ILogger<AdminController> _logger;

        public AdminController(IAdminService adminService, ILogger<AdminController> logger)
        {
            _adminService = adminService;
            _logger = logger;
        }

        // ── Dashboard ─────────────────────────────────────────────────────────────

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            try
            {
                var stats = await _adminService.GetDashboardStatsAsync();
                return Ok(new { data = stats });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching admin dashboard");
                return StatusCode(500, new { message = "An error occurred while fetching dashboard stats" });
            }
        }

        // ── User Management ───────────────────────────────────────────────────────

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 20;
                var result = await _adminService.GetAllUsersAsync(page, pageSize);
                return Ok(new { data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching users");
                return StatusCode(500, new { message = "An error occurred while fetching users" });
            }
        }

        [HttpGet("users/{userId}")]
        public async Task<IActionResult> GetUser(Guid userId)
        {
            try
            {
                var user = await _adminService.GetUserByIdAsync(userId);
                return Ok(new { data = user });
            }
            catch (InvalidOperationException ex) { return NotFound(new { message = ex.Message }); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        [HttpPatch("users/{userId}/status")]
        public async Task<IActionResult> UpdateUserStatus(Guid userId, [FromBody] UpdateUserStatusRequest request)
        {
            try
            {
                var result = await _adminService.UpdateUserStatusAsync(userId, request);
                return Ok(new { message = "User status updated", data = result });
            }
            catch (InvalidOperationException ex) { return NotFound(new { message = ex.Message }); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user status {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        [HttpPost("users/{userId}/roles")]
        public async Task<IActionResult> AssignRole(Guid userId, [FromBody] AssignRoleRequest request)
        {
            try
            {
                var result = await _adminService.AssignRoleAsync(userId, request);
                return Ok(new { message = "Role assigned successfully", data = result });
            }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error assigning role to user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        [HttpDelete("users/{userId}")]
        public async Task<IActionResult> DeleteUser(Guid userId)
        {
            try
            {
                // Prevent self-deletion
                var currentUserId = GetCurrentUserId();
                if (currentUserId == userId)
                    return BadRequest(new { message = "You cannot delete your own account" });

                await _adminService.DeleteUserAsync(userId);
                return Ok(new { message = "User deleted successfully" });
            }
            catch (InvalidOperationException ex) { return NotFound(new { message = ex.Message }); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        // ── Restaurant Management ─────────────────────────────────────────────────

        [HttpGet("restaurants")]
        public async Task<IActionResult> GetAllRestaurants([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 20;
                var result = await _adminService.GetAllRestaurantsAsync(page, pageSize);
                return Ok(new { data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching restaurants");
                return StatusCode(500, new { message = "An error occurred while fetching restaurants" });
            }
        }

        [HttpGet("restaurants/{restaurantId}")]
        public async Task<IActionResult> GetRestaurant(Guid restaurantId)
        {
            try
            {
                var result = await _adminService.GetRestaurantByIdAsync(restaurantId);
                return Ok(new { data = result });
            }
            catch (InvalidOperationException ex) { return NotFound(new { message = ex.Message }); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching restaurant {RestaurantId}", restaurantId);
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        [HttpPatch("restaurants/{restaurantId}/status")]
        public async Task<IActionResult> UpdateRestaurantStatus(Guid restaurantId, [FromBody] UpdateRestaurantStatusRequest request)
        {
            try
            {
                var result = await _adminService.UpdateRestaurantStatusAsync(restaurantId, request);
                return Ok(new { message = "Restaurant status updated", data = result });
            }
            catch (InvalidOperationException ex) { return NotFound(new { message = ex.Message }); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating restaurant status {RestaurantId}", restaurantId);
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        [HttpDelete("restaurants/{restaurantId}")]
        public async Task<IActionResult> DeleteRestaurant(Guid restaurantId)
        {
            try
            {
                await _adminService.DeleteRestaurantAsync(restaurantId);
                return Ok(new { message = "Restaurant deleted successfully" });
            }
            catch (InvalidOperationException ex) { return NotFound(new { message = ex.Message }); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting restaurant {RestaurantId}", restaurantId);
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        // ── Dish Management ───────────────────────────────────────────────────────

        [HttpGet("dishes")]
        public async Task<IActionResult> GetAllDishes([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 20;
                var result = await _adminService.GetAllDishesAsync(page, pageSize);
                return Ok(new { data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching dishes");
                return StatusCode(500, new { message = "An error occurred while fetching dishes" });
            }
        }

        [HttpPatch("dishes/{dishId}/status")]
        public async Task<IActionResult> UpdateDishStatus(Guid dishId, [FromBody] UpdateDishStatusRequest request)
        {
            try
            {
                var result = await _adminService.UpdateDishStatusAsync(dishId, request);
                return Ok(new { message = "Dish status updated", data = result });
            }
            catch (InvalidOperationException ex) { return NotFound(new { message = ex.Message }); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating dish status {DishId}", dishId);
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        [HttpDelete("dishes/{dishId}")]
        public async Task<IActionResult> DeleteDish(Guid dishId)
        {
            try
            {
                await _adminService.DeleteDishAsync(dishId);
                return Ok(new { message = "Dish deleted successfully" });
            }
            catch (InvalidOperationException ex) { return NotFound(new { message = ex.Message }); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting dish {DishId}", dishId);
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        // ── Order Management ──────────────────────────────────────────────────────

        [HttpGet("orders")]
        public async Task<IActionResult> GetAllOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 20;
                var result = await _adminService.GetAllOrdersAsync(page, pageSize);
                return Ok(new { data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching orders");
                return StatusCode(500, new { message = "An error occurred while fetching orders" });
            }
        }

        [HttpGet("orders/status/{status}")]
        public async Task<IActionResult> GetOrdersByStatus(string status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 20;
                var result = await _adminService.GetOrdersByStatusAsync(status, page, pageSize);
                return Ok(new { data = result });
            }
            catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching orders by status {Status}", status);
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        [HttpGet("orders/{orderId}")]
        public async Task<IActionResult> GetOrder(Guid orderId)
        {
            try
            {
                var result = await _adminService.GetOrderByIdAsync(orderId);
                return Ok(new { data = result });
            }
            catch (InvalidOperationException ex) { return NotFound(new { message = ex.Message }); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching order {OrderId}", orderId);
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        // ── Review Management ─────────────────────────────────────────────────────

        [HttpGet("reviews")]
        public async Task<IActionResult> GetAllReviews([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 20;
                var result = await _adminService.GetAllReviewsAsync(page, pageSize);
                return Ok(new { data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching reviews");
                return StatusCode(500, new { message = "An error occurred while fetching reviews" });
            }
        }

        [HttpPatch("reviews/{reviewId}/status")]
        public async Task<IActionResult> UpdateReviewStatus(Guid reviewId, [FromBody] UpdateReviewStatusRequest request)
        {
            try
            {
                var result = await _adminService.UpdateReviewStatusAsync(reviewId, request);
                return Ok(new { message = "Review status updated", data = result });
            }
            catch (InvalidOperationException ex) { return NotFound(new { message = ex.Message }); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating review status {ReviewId}", reviewId);
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        [HttpDelete("reviews/{reviewId}")]
        public async Task<IActionResult> DeleteReview(Guid reviewId)
        {
            try
            {
                await _adminService.DeleteReviewAsync(reviewId);
                return Ok(new { message = "Review deleted successfully" });
            }
            catch (InvalidOperationException ex) { return NotFound(new { message = ex.Message }); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting review {ReviewId}", reviewId);
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        // ── Audit Logs ────────────────────────────────────────────────────────────

        [HttpGet("audit-logs")]
        public async Task<IActionResult> GetAuditLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 200) pageSize = 50;
                var result = await _adminService.GetAuditLogsAsync(page, pageSize);
                return Ok(new { data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching audit logs");
                return StatusCode(500, new { message = "An error occurred while fetching audit logs" });
            }
        }

        [HttpGet("audit-logs/users/{userId}")]
        public async Task<IActionResult> GetUserAuditLogs(Guid userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 200) pageSize = 50;
                var result = await _adminService.GetUserAuditLogsAsync(userId, page, pageSize);
                return Ok(new { data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching audit logs for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred" });
            }
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