using FoodOrdering.Core.Enums;

namespace FoodOrdering.Application.DTOs.Admin
{
    // ── Requests ────────────────────────────────────────────────────────────────

    public class UpdateUserStatusRequest
    {
        public bool IsActive { get; set; }
        public string? Reason { get; set; }
    }

    public class AssignRoleRequest
    {
        public string Role { get; set; } = string.Empty; // "Admin", "Customer", "Restaurant"
    }

    public class UpdateRestaurantStatusRequest
    {
        public bool IsActive { get; set; }
        public string? Reason { get; set; }
    }

    public class UpdateDishStatusRequest
    {
        public bool IsActive { get; set; }
        public bool IsAvailable { get; set; }
    }

    public class UpdateReviewStatusRequest
    {
        public ReviewStatus Status { get; set; }
        public string? Reason { get; set; }
    }

    // ── Responses ───────────────────────────────────────────────────────────────

    public record PagedResult<T>(
        List<T> Items,
        int Page,
        int PageSize,
        int TotalCount,
        int TotalPages
    );

    public record AdminDashboardResponse(
        int TotalUsers,
        int TotalRestaurants,
        int TotalDishes,
        int TotalOrders,
        int TotalReviews,
        decimal TotalRevenue,
        int PendingOrders,
        int ActiveRestaurants,
        int NewUsersToday,
        int OrdersToday,
        decimal RevenueToday,
        List<DailyStatEntry> Last7DaysOrders,
        List<DailyStatEntry> Last7DaysRevenue
    );

    public record DailyStatEntry(DateTime Date, decimal Value);

    public record AdminUserResponse(
        Guid Id,
        string Username,
        string Email,
        string? PhoneNumber,
        bool IsActive,
        bool EmailVerified,
        List<string> Roles,
        DateTime CreatedAt,
        DateTime? LastLoginAt,
        string? LastLoginIp,
        int FailedLoginAttempts,
        bool IsLockedOut
    );

    public record AdminRestaurantResponse(
        Guid Id,
        Guid UserId,
        string OwnerUsername,
        string RestaurantName,
        string RestaurantSlug,
        string? RestaurantDescription,
        string? RestaurantLogo,
        string? PhoneNumber,
        string? Address,
        string? City,
        string? Country,
        bool IsActive,
        int TotalListings,
        int TotalOrders,
        decimal TotalRevenue,
        decimal AverageRating,
        int ReviewCount,
        DateTime CreatedAt
    );

    public record AdminDishResponse(
        Guid Id,
        Guid RestaurantId,
        string RestaurantName,
        string Title,
        string Slug,
        decimal Price,
        bool IsActive,
        bool IsAvailable,
        bool IsFeatured,
        int ViewCount,
        int ReviewCount,
        decimal AverageRating,
        DateTime CreatedAt
    );

    public record AdminOrderResponse(
        Guid Id,
        string OrderNumber,
        Guid CustomerId,
        string CustomerName,
        Guid RestaurantId,
        string RestaurantName,
        decimal TotalAmount,
        string Status,
        int ItemCount,
        DateTime CreatedAt,
        DateTime? DeliveredAt
    );

    public record AdminReviewResponse(
        Guid Id,
        Guid AuthorId,
        string AuthorName,
        Guid? DishId,
        string? DishTitle,
        Guid? RestaurantId,
        string? RestaurantName,
        int Rating,
        string? Comment,
        ReviewStatus Status,
        bool IsVerifiedPurchase,
        DateTime CreatedAt
    );

    public record AdminAuditLogResponse(
        Guid Id,
        Guid? UserId,
        string? Username,
        string Action,
        string? Details,
        string IpAddress,
        bool IsSuccess,
        DateTime CreatedAt
    );
}