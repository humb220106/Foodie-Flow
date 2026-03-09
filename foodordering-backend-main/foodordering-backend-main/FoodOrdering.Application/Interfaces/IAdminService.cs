



using FoodOrdering.Application.DTOs.Admin;

namespace FoodOrdering.Application.Interfaces
{
    public interface IAdminService
    {
        // Dashboard
        Task<AdminDashboardResponse> GetDashboardStatsAsync();

        // User Management
        Task<PagedResult<AdminUserResponse>> GetAllUsersAsync(int page = 1, int pageSize = 20);
        Task<AdminUserResponse> GetUserByIdAsync(Guid userId);
        Task<AdminUserResponse> UpdateUserStatusAsync(Guid userId, UpdateUserStatusRequest request);
        Task<AdminUserResponse> AssignRoleAsync(Guid userId, AssignRoleRequest request);
        Task DeleteUserAsync(Guid userId);

        // Restaurant Management
        Task<PagedResult<AdminRestaurantResponse>> GetAllRestaurantsAsync(int page = 1, int pageSize = 20);
        Task<AdminRestaurantResponse> GetRestaurantByIdAsync(Guid restaurantId);
        Task<AdminRestaurantResponse> UpdateRestaurantStatusAsync(Guid restaurantId, UpdateRestaurantStatusRequest request);
        Task DeleteRestaurantAsync(Guid restaurantId);

        // Dish Management
        Task<PagedResult<AdminDishResponse>> GetAllDishesAsync(int page = 1, int pageSize = 20);
        Task<AdminDishResponse> UpdateDishStatusAsync(Guid dishId, UpdateDishStatusRequest request);
        Task DeleteDishAsync(Guid dishId);

        // Order Management
        Task<PagedResult<AdminOrderResponse>> GetAllOrdersAsync(int page = 1, int pageSize = 20);
        Task<PagedResult<AdminOrderResponse>> GetOrdersByStatusAsync(string status, int page = 1, int pageSize = 20);
        Task<AdminOrderResponse> GetOrderByIdAsync(Guid orderId);

        // Review Management
        Task<PagedResult<AdminReviewResponse>> GetAllReviewsAsync(int page = 1, int pageSize = 20);
        Task<AdminReviewResponse> UpdateReviewStatusAsync(Guid reviewId, UpdateReviewStatusRequest request);
        Task DeleteReviewAsync(Guid reviewId);

        // Audit Logs
        Task<PagedResult<AdminAuditLogResponse>> GetAuditLogsAsync(int page = 1, int pageSize = 50);
        Task<PagedResult<AdminAuditLogResponse>> GetUserAuditLogsAsync(Guid userId, int page = 1, int pageSize = 50);

        // Reports
        Task<RevenueReportResponse> GetRevenueReportAsync(int days = 30);
        Task<OrdersReportResponse> GetOrdersReportAsync(int days = 30);
        Task<UsersReportResponse> GetUsersReportAsync(int days = 30);
        Task<RestaurantsReportResponse> GetRestaurantsReportAsync();
        Task<AdminSummaryReportResponse> GetSummaryReportAsync();
    }
}