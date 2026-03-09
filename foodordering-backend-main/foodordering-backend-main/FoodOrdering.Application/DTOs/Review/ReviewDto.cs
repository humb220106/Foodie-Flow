using FoodOrdering.Core.Enums;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.DTOs.Review
{

    public class CreateDishReviewRequest
    {
        public Guid DishId { get; set; }
        public int Rating { get; set; }          // 1–5
        public string? Comment { get; set; }
        public List<IFormFile>? Images { get; set; }
    }

    public class CreateRestaurantReviewRequest
    {
        public Guid RestaurantId { get; set; }
        public int Rating { get; set; }          // 1–5
        public string? Comment { get; set; }
        public List<IFormFile>? Images { get; set; }
    }

    public class UpdateReviewRequest
    {
        public int? Rating { get; set; }
        public string? Comment { get; set; }
    }

    public class RestaurantReplyRequest
    {
        public string Reply { get; set; } = string.Empty;
    }

   
    public record ReviewResponse(
        Guid Id,
        Guid AuthorId,
        string AuthorName,
        int Rating,
        string? Comment,
        List<string>? Images,
        string? RestaurantReply,
        DateTime? RepliedAt,
        bool IsVerifiedPurchase,
        int HelpfulCount,
        ReviewStatus Status,
        DateTime CreatedAt,
        DateTime? UpdatedAt
    );

    public record DishReviewResponse(
        Guid DishId,
        string DishTitle,
        ReviewResponse Review
    );

    public record RestaurantReviewResponse(
        Guid RestaurantId,
        string RestaurantName,
        ReviewResponse Review
    );

    public record ReviewSummary(
        double AverageRating,
        int TotalReviews,
        int FiveStars,
        int FourStars,
        int ThreeStars,
        int TwoStars,
        int OneStar
    );

    public record PagedReviewResult<T>(
        List<T> Reviews,
        ReviewSummary Summary,
        int Page,
        int PageSize,
        int TotalCount
    );
}
