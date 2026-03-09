using FoodOrdering.Core.Enums;

namespace FoodOrdering.Core.Entities
{
    public class Review
    {
        public Guid Id { get; set; }
        public Guid AuthorId { get; set; }
        public User Author { get; set; } = null!;

        // One of these will be set depending on review type
        public Guid? DishId { get; set; }
        public Dish? Dish { get; set; }

        public Guid? RestaurantId { get; set; }
        public Restaurant? Restaurant { get; set; }

        public int Rating { get; set; }         // 1–5
        public string? Comment { get; set; }
        public string? Images { get; set; }     // JSON array of URLs

        public string? RestaurantReply { get; set; }
        public DateTime? RepliedAt { get; set; }

        public bool IsVerifiedPurchase { get; set; }
        public int HelpfulCount { get; set; }

        public ReviewStatus Status { get; set; } = ReviewStatus.Published;
        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}