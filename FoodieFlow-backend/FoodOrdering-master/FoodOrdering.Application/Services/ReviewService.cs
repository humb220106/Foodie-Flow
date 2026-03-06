using FoodOrdering.Application.DTOs.Review;
using FoodOrdering.Application.Interfaces;
using FoodOrdering.Application.Repositories;
using FoodOrdering.Core.Entities;
using FoodOrdering.Core.Enums;
using Microsoft.Extensions.Logging;

namespace FoodOrdering.Application.Services
{
    public class ReviewService : IReviewService
    {
        private readonly IReviewRepository _reviewRepository;
        private readonly IDishRepository _dishRepository;
        private readonly IRestaurantRepository _restaurantRepository;
        private readonly IAuthRepository _authRepository;
        private readonly IAuditLogRepository _auditLogRepository;
        private readonly IFileStorageService _fileStorageService;
        private readonly ILogger<ReviewService> _logger;

        public ReviewService(
            IReviewRepository reviewRepository,
            IDishRepository dishRepository,
            IRestaurantRepository restaurantRepository,
            IAuthRepository authRepository,
            IAuditLogRepository auditLogRepository,
            IFileStorageService fileStorageService,
            ILogger<ReviewService> logger)
        {
            _reviewRepository = reviewRepository;
            _dishRepository = dishRepository;
            _restaurantRepository = restaurantRepository;
            _authRepository = authRepository;
            _auditLogRepository = auditLogRepository;
            _fileStorageService = fileStorageService;
            _logger = logger;
        }

        // ── Dish Reviews ─────────────────────────────────────────────────────────

        public async Task<DishReviewResponse> CreateDishReviewAsync(Guid customerId, CreateDishReviewRequest request)
        {
            ValidateRating(request.Rating);

            var dish = await _dishRepository.GetByIdAsync(request.DishId)
                ?? throw new InvalidOperationException("Dish not found.");

            // One review per user per dish
            var existing = await _reviewRepository.GetByAuthorAndDishAsync(customerId, request.DishId);
            if (existing != null)
                throw new InvalidOperationException("You have already reviewed this dish.");

            // Verify purchase (optional enforcement — set IsVerifiedPurchase flag)
            var isVerified = await _reviewRepository.HasUserOrderedDishAsync(customerId, request.DishId);

            List<string>? imageUrls = null;
            if (request.Images != null && request.Images.Any())
                imageUrls = await _fileStorageService.UploadImagesAsync(request.Images, "reviews");

            var review = new Review
            {
                Id = Guid.NewGuid(),
                AuthorId = customerId,
                DishId = request.DishId,
                Rating = request.Rating,
                Comment = request.Comment,
                Images = imageUrls != null ? System.Text.Json.JsonSerializer.Serialize(imageUrls) : null,
                IsVerifiedPurchase = isVerified,
                Status = ReviewStatus.Published,
                CreatedAt = DateTime.UtcNow
            };

            await _reviewRepository.CreateAsync(review);
            await UpdateDishRatingAsync(request.DishId);
            await LogAuditAsync(customerId, "Dish Reviewed", $"Dish: {dish.Title} - Rating: {request.Rating}/5", "System", true);

            _logger.LogInformation("Dish {DishId} reviewed by customer {CustomerId}", request.DishId, customerId);

            return await MapToDishReviewResponseAsync(review, dish.Title);
        }

        public async Task<PagedReviewResult<DishReviewResponse>> GetDishReviewsAsync(Guid dishId, int page = 1, int pageSize = 20)
        {
            var skip = (page - 1) * pageSize;
            var reviews = await _reviewRepository.GetByDishIdAsync(dishId, skip, pageSize);
            var totalCount = await _reviewRepository.GetCountByDishIdAsync(dishId);
            var distribution = await _reviewRepository.GetRatingDistributionByDishIdAsync(dishId);
            var average = await _reviewRepository.GetAverageRatingByDishIdAsync(dishId);

            var dish = await _dishRepository.GetByIdAsync(dishId);
            var dishTitle = dish?.Title ?? string.Empty;

            var mapped = new List<DishReviewResponse>();
            foreach (var r in reviews)
                mapped.Add(await MapToDishReviewResponseAsync(r, dishTitle));

            return new PagedReviewResult<DishReviewResponse>(
                mapped,
                BuildSummary(average, totalCount, distribution),
                page, pageSize, totalCount
            );
        }

        // ── Restaurant Reviews ───────────────────────────────────────────────────

        public async Task<RestaurantReviewResponse> CreateRestaurantReviewAsync(Guid customerId, CreateRestaurantReviewRequest request)
        {
            ValidateRating(request.Rating);

            var restaurant = await _restaurantRepository.GetByIdAsync(request.RestaurantId)
                ?? throw new InvalidOperationException("Restaurant not found.");

            var existing = await _reviewRepository.GetByAuthorAndRestaurantAsync(customerId, request.RestaurantId);
            if (existing != null)
                throw new InvalidOperationException("You have already reviewed this restaurant.");

            var isVerified = await _reviewRepository.HasUserOrderedFromRestaurantAsync(customerId, request.RestaurantId);

            List<string>? imageUrls = null;
            if (request.Images != null && request.Images.Any())
                imageUrls = await _fileStorageService.UploadImagesAsync(request.Images, "reviews");

            var review = new Review
            {
                Id = Guid.NewGuid(),
                AuthorId = customerId,
                RestaurantId = request.RestaurantId,
                Rating = request.Rating,
                Comment = request.Comment,
                Images = imageUrls != null ? System.Text.Json.JsonSerializer.Serialize(imageUrls) : null,
                IsVerifiedPurchase = isVerified,
                Status = ReviewStatus.Published,
                CreatedAt = DateTime.UtcNow
            };

            await _reviewRepository.CreateAsync(review);
            await UpdateRestaurantRatingAsync(request.RestaurantId);
            await LogAuditAsync(customerId, "Restaurant Reviewed", $"Restaurant: {restaurant.RestaurantName} - Rating: {request.Rating}/5", "System", true);

            _logger.LogInformation("Restaurant {RestaurantId} reviewed by customer {CustomerId}", request.RestaurantId, customerId);

            return await MapToRestaurantReviewResponseAsync(review, restaurant.RestaurantName);
        }

        public async Task<PagedReviewResult<RestaurantReviewResponse>> GetRestaurantReviewsAsync(Guid restaurantId, int page = 1, int pageSize = 20)
        {
            var skip = (page - 1) * pageSize;
            var reviews = await _reviewRepository.GetByRestaurantIdAsync(restaurantId, skip, pageSize);
            var totalCount = await _reviewRepository.GetCountByRestaurantIdAsync(restaurantId);
            var distribution = await _reviewRepository.GetRatingDistributionByRestaurantIdAsync(restaurantId);
            var average = await _reviewRepository.GetAverageRatingByRestaurantIdAsync(restaurantId);

            var restaurant = await _restaurantRepository.GetByIdAsync(restaurantId);
            var restaurantName = restaurant?.RestaurantName ?? string.Empty;

            var mapped = new List<RestaurantReviewResponse>();
            foreach (var r in reviews)
                mapped.Add(await MapToRestaurantReviewResponseAsync(r, restaurantName));

            return new PagedReviewResult<RestaurantReviewResponse>(
                mapped,
                BuildSummary(average, totalCount, distribution),
                page, pageSize, totalCount
            );
        }

        // ── Restaurant Reply ─────────────────────────────────────────────────────

        public async Task<ReviewResponse> AddRestaurantReplyAsync(Guid reviewId, Guid restaurantUserId, RestaurantReplyRequest request)
        {
            var review = await _reviewRepository.GetByIdAsync(reviewId)
                ?? throw new InvalidOperationException("Review not found.");

            // Confirm the replying user owns the restaurant being reviewed
            if (review.RestaurantId.HasValue)
            {
                var restaurant = await _restaurantRepository.GetByIdAsync(review.RestaurantId.Value)
                    ?? throw new InvalidOperationException("Restaurant not found.");
                if (restaurant.UserId != restaurantUserId)
                    throw new UnauthorizedAccessException("You don't have permission to reply to this review.");
            }
            else if (review.DishId.HasValue)
            {
                var dish = await _dishRepository.GetByIdAsync(review.DishId.Value)
                    ?? throw new InvalidOperationException("Dish not found.");
                var restaurant = await _restaurantRepository.GetByIdAsync(dish.RestaurantId)
                    ?? throw new InvalidOperationException("Restaurant not found.");
                if (restaurant.UserId != restaurantUserId)
                    throw new UnauthorizedAccessException("You don't have permission to reply to this review.");
            }

            if (!string.IsNullOrWhiteSpace(review.RestaurantReply))
                throw new InvalidOperationException("A reply has already been posted for this review.");

            review.RestaurantReply = request.Reply;
            review.RepliedAt = DateTime.UtcNow;
            review.UpdatedAt = DateTime.UtcNow;

            await _reviewRepository.UpdateAsync(review);
            _logger.LogInformation("Restaurant reply added to review {ReviewId}", reviewId);

            return await MapToReviewResponseAsync(review);
        }

        // ── Shared ───────────────────────────────────────────────────────────────

        public async Task<ReviewResponse> UpdateReviewAsync(Guid reviewId, Guid customerId, UpdateReviewRequest request)
        {
            var review = await _reviewRepository.GetByIdAsync(reviewId)
                ?? throw new InvalidOperationException("Review not found.");

            if (review.AuthorId != customerId)
                throw new UnauthorizedAccessException("You don't have permission to update this review.");

            if (request.Rating.HasValue)
            {
                ValidateRating(request.Rating.Value);
                review.Rating = request.Rating.Value;
            }

            if (!string.IsNullOrWhiteSpace(request.Comment))
                review.Comment = request.Comment;

            review.UpdatedAt = DateTime.UtcNow;
            await _reviewRepository.UpdateAsync(review);

            // Recalculate ratings
            if (review.DishId.HasValue)
                await UpdateDishRatingAsync(review.DishId.Value);
            if (review.RestaurantId.HasValue)
                await UpdateRestaurantRatingAsync(review.RestaurantId.Value);

            return await MapToReviewResponseAsync(review);
        }

        public async Task DeleteReviewAsync(Guid reviewId, Guid userId)
        {
            var review = await _reviewRepository.GetByIdAsync(reviewId)
                ?? throw new InvalidOperationException("Review not found.");

            // Allow the author or an admin
            var userRoles = await _authRepository.GetUserRolesAsync(userId);
            if (review.AuthorId != userId && !userRoles.Contains("Admin"))
                throw new UnauthorizedAccessException("You don't have permission to delete this review.");

            // Clean up review images
            if (!string.IsNullOrEmpty(review.Images))
            {
                var urls = System.Text.Json.JsonSerializer.Deserialize<List<string>>(review.Images);
                if (urls != null)
                    await _fileStorageService.DeleteImagesAsync(urls);
            }

            await _reviewRepository.DeleteAsync(reviewId);

            if (review.DishId.HasValue) await UpdateDishRatingAsync(review.DishId.Value);
            if (review.RestaurantId.HasValue) await UpdateRestaurantRatingAsync(review.RestaurantId.Value);

            _logger.LogInformation("Review {ReviewId} deleted by user {UserId}", reviewId, userId);
        }

        public async Task<List<DishReviewResponse>> GetMyDishReviewsAsync(Guid customerId, int page = 1, int pageSize = 20)
        {
            var skip = (page - 1) * pageSize;
            var reviews = await _reviewRepository.GetByAuthorIdAsync(customerId, skip, pageSize);
            var dishReviews = reviews.Where(r => r.DishId.HasValue).ToList();

            var result = new List<DishReviewResponse>();
            foreach (var r in dishReviews)
            {
                var dish = await _dishRepository.GetByIdAsync(r.DishId!.Value);
                result.Add(await MapToDishReviewResponseAsync(r, dish?.Title ?? string.Empty));
            }
            return result;
        }

        public async Task<List<RestaurantReviewResponse>> GetMyRestaurantReviewsAsync(Guid customerId, int page = 1, int pageSize = 20)
        {
            var skip = (page - 1) * pageSize;
            var reviews = await _reviewRepository.GetByAuthorIdAsync(customerId, skip, pageSize);
            var restaurantReviews = reviews.Where(r => r.RestaurantId.HasValue).ToList();

            var result = new List<RestaurantReviewResponse>();
            foreach (var r in restaurantReviews)
            {
                var restaurant = await _restaurantRepository.GetByIdAsync(r.RestaurantId!.Value);
                result.Add(await MapToRestaurantReviewResponseAsync(r, restaurant?.RestaurantName ?? string.Empty));
            }
            return result;
        }

        public async Task MarkReviewHelpfulAsync(Guid reviewId, Guid userId)
        {
            var review = await _reviewRepository.GetByIdAsync(reviewId)
                ?? throw new InvalidOperationException("Review not found.");

            review.HelpfulCount++;
            await _reviewRepository.UpdateAsync(review);
        }

        // ── Private Helpers ──────────────────────────────────────────────────────

        private static void ValidateRating(int rating)
        {
            if (rating < 1 || rating > 5)
                throw new ArgumentException("Rating must be between 1 and 5.");
        }

        private async Task UpdateDishRatingAsync(Guid dishId)
        {
            var dish = await _dishRepository.GetByIdAsync(dishId);
            if (dish == null) return;

            dish.AverageRating = (decimal)await _reviewRepository.GetAverageRatingByDishIdAsync(dishId);
            dish.ReviewCount = await _reviewRepository.GetCountByDishIdAsync(dishId);
            await _dishRepository.UpdateAsync(dish);
        }

        private async Task UpdateRestaurantRatingAsync(Guid restaurantId)
        {
            var restaurant = await _restaurantRepository.GetByIdAsync(restaurantId);
            if (restaurant == null) return;

            restaurant.AverageRating = (decimal)await _reviewRepository.GetAverageRatingByRestaurantIdAsync(restaurantId);
            restaurant.ReviewCount = await _reviewRepository.GetCountByRestaurantIdAsync(restaurantId);
            await _restaurantRepository.UpdateAsync(restaurant);
        }

        private static ReviewSummary BuildSummary(double average, int total, Dictionary<int, int> dist) =>
            new(
                Math.Round(average, 1),
                total,
                dist.GetValueOrDefault(5),
                dist.GetValueOrDefault(4),
                dist.GetValueOrDefault(3),
                dist.GetValueOrDefault(2),
                dist.GetValueOrDefault(1)
            );

        private async Task<ReviewResponse> MapToReviewResponseAsync(Review review)
        {
            var author = await _authRepository.GetByIdAsync(review.AuthorId);
            var images = review.Images != null
                ? System.Text.Json.JsonSerializer.Deserialize<List<string>>(review.Images)
                : null;

            return new ReviewResponse(
                review.Id,
                review.AuthorId,
                author?.Username ?? "Unknown",
                review.Rating,
                review.Comment,
                images,
                review.RestaurantReply,
                review.RepliedAt,
                review.IsVerifiedPurchase,
                review.HelpfulCount,
                review.Status,
                review.CreatedAt,
                review.UpdatedAt
            );
        }

        private async Task<DishReviewResponse> MapToDishReviewResponseAsync(Review review, string dishTitle) =>
            new(review.DishId!.Value, dishTitle, await MapToReviewResponseAsync(review));

        private async Task<RestaurantReviewResponse> MapToRestaurantReviewResponseAsync(Review review, string restaurantName) =>
            new(review.RestaurantId!.Value, restaurantName, await MapToReviewResponseAsync(review));

        private async Task LogAuditAsync(Guid userId, string action, string details, string ipAddress, bool isSuccess)
        {
            var auditLog = new AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Action = action,
                Details = details,
                IpAddress = ipAddress,
                CreatedAt = DateTime.UtcNow,
                IsSuccess = isSuccess
            };

            await _auditLogRepository.CreateAsync(auditLog);
        }
    }
}