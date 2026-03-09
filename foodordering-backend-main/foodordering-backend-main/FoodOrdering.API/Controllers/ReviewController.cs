using FoodOrdering.Application.DTOs.Review;
using FoodOrdering.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FoodOrdering.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewController : ControllerBase
    {
        private readonly IReviewService _reviewService;
        private readonly IRestaurantService _restaurantService;
        private readonly ILogger<ReviewController> _logger;

        public ReviewController(
            IReviewService reviewService,
            IRestaurantService restaurantService,
            ILogger<ReviewController> logger)
        {
            _reviewService = reviewService;
            _restaurantService = restaurantService;
            _logger = logger;
        }

        // ── Dish Reviews ─────────────────────────────────────────────────────────

        [HttpPost("dish")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> CreateDishReview([FromForm] CreateDishReviewRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _reviewService.CreateDishReviewAsync(userId, request);
                return CreatedAtAction(nameof(GetDishReviews), new { dishId = request.DishId },
                    new { message = "Review submitted successfully", data = result });
            }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating dish review");
                return StatusCode(500, new { message = "An error occurred while submitting your review" });
            }
        }

        [HttpGet("dish/{dishId}")]
        public async Task<IActionResult> GetDishReviews(
            Guid dishId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 20;

                var result = await _reviewService.GetDishReviewsAsync(dishId, page, pageSize);
                return Ok(new { data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving dish reviews for {DishId}", dishId);
                return StatusCode(500, new { message = "An error occurred while retrieving reviews" });
            }
        }

        // ── Restaurant Reviews ───────────────────────────────────────────────────

        [HttpPost("restaurant")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> CreateRestaurantReview([FromForm] CreateRestaurantReviewRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _reviewService.CreateRestaurantReviewAsync(userId, request);
                return CreatedAtAction(nameof(GetRestaurantReviews), new { restaurantId = request.RestaurantId },
                    new { message = "Review submitted successfully", data = result });
            }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating restaurant review");
                return StatusCode(500, new { message = "An error occurred while submitting your review" });
            }
        }

        [HttpGet("restaurant/{restaurantId}")]
        public async Task<IActionResult> GetRestaurantReviews(
            Guid restaurantId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 20;

                var result = await _reviewService.GetRestaurantReviewsAsync(restaurantId, page, pageSize);
                return Ok(new { data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving restaurant reviews for {RestaurantId}", restaurantId);
                return StatusCode(500, new { message = "An error occurred while retrieving reviews" });
            }
        }

        // ── Restaurant Reply ─────────────────────────────────────────────────────

        [HttpPost("{reviewId}/reply")]
        [Authorize(Roles = "Restaurant")]
        public async Task<IActionResult> ReplyToReview(Guid reviewId, [FromBody] RestaurantReplyRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _reviewService.AddRestaurantReplyAsync(reviewId, userId, request);
                return Ok(new { message = "Reply posted successfully", data = result });
            }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
            catch (UnauthorizedAccessException) { return Forbid(); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error posting reply to review {ReviewId}", reviewId);
                return StatusCode(500, new { message = "An error occurred while posting your reply" });
            }
        }

        // ── Shared ───────────────────────────────────────────────────────────────

        [HttpPut("{reviewId}")]
        [Authorize]
        public async Task<IActionResult> UpdateReview(Guid reviewId, [FromBody] UpdateReviewRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _reviewService.UpdateReviewAsync(reviewId, userId, request);
                return Ok(new { message = "Review updated successfully", data = result });
            }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
            catch (UnauthorizedAccessException) { return Forbid(); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating review {ReviewId}", reviewId);
                return StatusCode(500, new { message = "An error occurred while updating the review" });
            }
        }

        [HttpDelete("{reviewId}")]
        [Authorize]
        public async Task<IActionResult> DeleteReview(Guid reviewId)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _reviewService.DeleteReviewAsync(reviewId, userId);
                return Ok(new { message = "Review deleted successfully" });
            }
            catch (InvalidOperationException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException) { return Forbid(); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting review {ReviewId}", reviewId);
                return StatusCode(500, new { message = "An error occurred while deleting the review" });
            }
        }

        [HttpPost("{reviewId}/helpful")]
        [Authorize]
        public async Task<IActionResult> MarkHelpful(Guid reviewId)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _reviewService.MarkReviewHelpfulAsync(reviewId, userId);
                return Ok(new { message = "Marked as helpful" });
            }
            catch (InvalidOperationException ex) { return NotFound(new { message = ex.Message }); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking review {ReviewId} as helpful", reviewId);
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        [HttpGet("my/dishes")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetMyDishReviews([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _reviewService.GetMyDishReviewsAsync(userId, page, pageSize);
                return Ok(new { data = result, page, pageSize, count = result.Count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving dish reviews for user");
                return StatusCode(500, new { message = "An error occurred while retrieving your reviews" });
            }
        }

        [HttpGet("my/restaurants")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetMyRestaurantReviews([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _reviewService.GetMyRestaurantReviewsAsync(userId, page, pageSize);
                return Ok(new { data = result, page, pageSize, count = result.Count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving restaurant reviews for user");
                return StatusCode(500, new { message = "An error occurred while retrieving your reviews" });
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