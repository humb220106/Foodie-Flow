using FoodOrdering.Application.DTOs.Review;

namespace FoodOrdering.Application.Interfaces
{
    public interface IReviewService
    {
        // Dish reviews
        Task<DishReviewResponse> CreateDishReviewAsync(Guid customerId, CreateDishReviewRequest request);
        Task<PagedReviewResult<DishReviewResponse>> GetDishReviewsAsync(Guid dishId, int page = 1, int pageSize = 20);

        // Restaurant reviews
        Task<RestaurantReviewResponse> CreateRestaurantReviewAsync(Guid customerId, CreateRestaurantReviewRequest request);
        Task<PagedReviewResult<RestaurantReviewResponse>> GetRestaurantReviewsAsync(Guid restaurantId, int page = 1, int pageSize = 20);

        // Restaurant reply
        Task<ReviewResponse> AddRestaurantReplyAsync(Guid reviewId, Guid restaurantUserId, RestaurantReplyRequest request);

        // Shared
        Task<ReviewResponse> UpdateReviewAsync(Guid reviewId, Guid customerId, UpdateReviewRequest request);
        Task DeleteReviewAsync(Guid reviewId, Guid userId);
        Task<List<DishReviewResponse>> GetMyDishReviewsAsync(Guid customerId, int page = 1, int pageSize = 20);
        Task<List<RestaurantReviewResponse>> GetMyRestaurantReviewsAsync(Guid customerId, int page = 1, int pageSize = 20);
        Task MarkReviewHelpfulAsync(Guid reviewId, Guid userId);
    }
}