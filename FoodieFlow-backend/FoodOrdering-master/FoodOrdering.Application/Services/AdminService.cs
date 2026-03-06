using FoodOrdering.Application.DTOs.Admin;
using FoodOrdering.Application.Interfaces;
using FoodOrdering.Application.Repositories;
using FoodOrdering.Core.Enums;
using Microsoft.Extensions.Logging;

namespace FoodOrdering.Application.Services
{
    public class AdminService : IAdminService
    {
        private readonly IAuthRepository _authRepository;
        private readonly IRestaurantRepository _restaurantRepository;
        private readonly IDishRepository _dishRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IReviewRepository _reviewRepository;
        private readonly IAuditLogRepository _auditLogRepository;
        private readonly IRoleRepository _roleRepository;
        private readonly ILogger<AdminService> _logger;

        public AdminService(
            IAuthRepository authRepository,
            IRestaurantRepository restaurantRepository,
            IDishRepository dishRepository,
            IOrderRepository orderRepository,
            IReviewRepository reviewRepository,
            IAuditLogRepository auditLogRepository,
            IRoleRepository roleRepository,
            ILogger<AdminService> logger)
        {
            _authRepository = authRepository;
            _restaurantRepository = restaurantRepository;
            _dishRepository = dishRepository;
            _orderRepository = orderRepository;
            _reviewRepository = reviewRepository;
            _auditLogRepository = auditLogRepository;
            _roleRepository = roleRepository;
            _logger = logger;
        }

        // ── Dashboard ─────────────────────────────────────────────────────────────

        public async Task<AdminDashboardResponse> GetDashboardStatsAsync()
        {
            var today = DateTime.UtcNow.Date;

            var totalUsers = (await _authRepository.GetAllAsync(0, int.MaxValue)).Count;
            var allRestaurants = await _restaurantRepository.SearchRestaurantAsync(string.Empty, 0, int.MaxValue);
            var totalOrders = await _orderRepository.GetTotalOrderCountAsync();
            var totalRevenue = await _orderRepository.GetTotalRevenueAsync();
            var pendingOrders = await _orderRepository.GetOrderCountByStatusAsync(OrderStatus.Pending);
            var activeRestaurants = allRestaurants.Count(r => r.IsActive);

            var newUsersToday = (await _authRepository.GetAllAsync(0, int.MaxValue))
                .Count(u => u.CreatedAt.Date == today);

            var ordersToday = await _orderRepository.GetOrdersCountByDateAsync(today);
            var revenueToday = await _orderRepository.GetRevenueByDateAsync(today);

            // Last 7 days stats
            var last7DaysOrders = new List<DailyStatEntry>();
            var last7DaysRevenue = new List<DailyStatEntry>();

            for (int i = 6; i >= 0; i--)
            {
                var date = today.AddDays(-i);
                var count = await _orderRepository.GetOrdersCountByDateAsync(date);
                var rev = await _orderRepository.GetRevenueByDateAsync(date);
                last7DaysOrders.Add(new DailyStatEntry(date, count));
                last7DaysRevenue.Add(new DailyStatEntry(date, rev));
            }

            var totalDishes = (await _dishRepository.GetAllAsync(0, int.MaxValue)).Count;
            var totalReviews = await _reviewRepository.GetTotalCountAsync();

            return new AdminDashboardResponse(
                totalUsers,
                allRestaurants.Count,
                totalDishes,
                totalOrders,
                totalReviews,
                totalRevenue,
                pendingOrders,
                activeRestaurants,
                newUsersToday,
                ordersToday,
                revenueToday,
                last7DaysOrders,
                last7DaysRevenue
            );
        }

        // ── User Management ──────────────────────────────────────────────────────

        public async Task<PagedResult<AdminUserResponse>> GetAllUsersAsync(int page = 1, int pageSize = 20)
        {
            var skip = (page - 1) * pageSize;
            var users = await _authRepository.GetAllAsync(skip, pageSize);
            var totalCount = await _authRepository.GetTotalCountAsync();

            var mapped = new List<AdminUserResponse>();
            foreach (var user in users)
            {
                var roles = await _authRepository.GetUserRolesAsync(user.Id);
                mapped.Add(MapToAdminUserResponse(user, roles));
            }

            return new PagedResult<AdminUserResponse>(
                mapped, page, pageSize, totalCount,
                (int)Math.Ceiling((double)totalCount / pageSize)
            );
        }

        public async Task<AdminUserResponse> GetUserByIdAsync(Guid userId)
        {
            var user = await _authRepository.GetByIdAsync(userId)
                ?? throw new InvalidOperationException("User not found.");

            var roles = await _authRepository.GetUserRolesAsync(userId);
            return MapToAdminUserResponse(user, roles);
        }

        public async Task<AdminUserResponse> UpdateUserStatusAsync(Guid userId, UpdateUserStatusRequest request)
        {
            var user = await _authRepository.GetByIdAsync(userId)
                ?? throw new InvalidOperationException("User not found.");

            user.IsActive = request.IsActive;
            await _authRepository.UpdateAsync(user);

            await LogAuditAsync(userId, request.IsActive ? "User Activated" : "User Deactivated",
                request.Reason ?? $"User {user.Username} status updated by admin");

            _logger.LogInformation("User {UserId} status updated to {Status} by admin", userId, request.IsActive);

            var roles = await _authRepository.GetUserRolesAsync(userId);
            return MapToAdminUserResponse(user, roles);
        }

        public async Task<AdminUserResponse> AssignRoleAsync(Guid userId, AssignRoleRequest request)
        {
            var user = await _authRepository.GetByIdAsync(userId)
                ?? throw new InvalidOperationException("User not found.");

            var role = await _roleRepository.GetByNameAsync(request.Role)
                ?? throw new InvalidOperationException($"Role '{request.Role}' not found.");

            await _roleRepository.AssignRoleToUserAsync(userId, role.Id);

            await LogAuditAsync(userId, "Role Assigned", $"Role '{request.Role}' assigned to user {user.Username} by admin");
            _logger.LogInformation("Role {Role} assigned to user {UserId}", request.Role, userId);

            var roles = await _authRepository.GetUserRolesAsync(userId);
            return MapToAdminUserResponse(user, roles);
        }

        public async Task DeleteUserAsync(Guid userId)
        {
            var user = await _authRepository.GetByIdAsync(userId)
                ?? throw new InvalidOperationException("User not found.");

            await _authRepository.DeleteAsync(userId);
            await LogAuditAsync(userId, "User Deleted", $"User {user.Username} deleted by admin");
            _logger.LogInformation("User {UserId} deleted by admin", userId);
        }

        // ── Restaurant Management ─────────────────────────────────────────────────

        public async Task<PagedResult<AdminRestaurantResponse>> GetAllRestaurantsAsync(int page = 1, int pageSize = 20)
        {
            var skip = (page - 1) * pageSize;
            var restaurants = await _restaurantRepository.GetAllAsync(skip, pageSize);
            var totalCount = await _restaurantRepository.GetTotalCountAsync();

            var mapped = new List<AdminRestaurantResponse>();
            foreach (var r in restaurants)
            {
                var totalOrders = await _orderRepository.GetTotalOrderCountAsync(r.Id);
                var totalRevenue = await _orderRepository.GetTotalRevenueAsync(r.Id);
                mapped.Add(MapToAdminRestaurantResponse(r, totalOrders, totalRevenue));
            }

            return new PagedResult<AdminRestaurantResponse>(
                mapped, page, pageSize, totalCount,
                (int)Math.Ceiling((double)totalCount / pageSize)
            );
        }

        public async Task<AdminRestaurantResponse> GetRestaurantByIdAsync(Guid restaurantId)
        {
            var restaurant = await _restaurantRepository.GetByIdAsync(restaurantId)
                ?? throw new InvalidOperationException("Restaurant not found.");

            var totalOrders = await _orderRepository.GetTotalOrderCountAsync(restaurantId);
            var totalRevenue = await _orderRepository.GetTotalRevenueAsync(restaurantId);

            return MapToAdminRestaurantResponse(restaurant, totalOrders, totalRevenue);
        }

        public async Task<AdminRestaurantResponse> UpdateRestaurantStatusAsync(Guid restaurantId, UpdateRestaurantStatusRequest request)
        {
            var restaurant = await _restaurantRepository.GetByIdAsync(restaurantId)
                ?? throw new InvalidOperationException("Restaurant not found.");

            restaurant.IsActive = request.IsActive;
            await _restaurantRepository.UpdateAsync(restaurant);

            await LogAuditAsync(restaurant.UserId,
                request.IsActive ? "Restaurant Activated" : "Restaurant Deactivated",
                request.Reason ?? $"Restaurant '{restaurant.RestaurantName}' status updated by admin");

            _logger.LogInformation("Restaurant {RestaurantId} status updated to {Status} by admin", restaurantId, request.IsActive);

            var totalOrders = await _orderRepository.GetTotalOrderCountAsync(restaurantId);
            var totalRevenue = await _orderRepository.GetTotalRevenueAsync(restaurantId);
            return MapToAdminRestaurantResponse(restaurant, totalOrders, totalRevenue);
        }

        public async Task DeleteRestaurantAsync(Guid restaurantId)
        {
            var restaurant = await _restaurantRepository.GetByIdAsync(restaurantId)
                ?? throw new InvalidOperationException("Restaurant not found.");

            // Soft delete by deactivating
            restaurant.IsActive = false;
            await _restaurantRepository.UpdateAsync(restaurant);

            await LogAuditAsync(restaurant.UserId, "Restaurant Deleted",
                $"Restaurant '{restaurant.RestaurantName}' deleted by admin");

            _logger.LogInformation("Restaurant {RestaurantId} deleted by admin", restaurantId);
        }

        // ── Dish Management ───────────────────────────────────────────────────────

        public async Task<PagedResult<AdminDishResponse>> GetAllDishesAsync(int page = 1, int pageSize = 20)
        {
            var skip = (page - 1) * pageSize;
            var dishes = await _dishRepository.GetAllAsync(skip, pageSize);
            var totalCount = await _dishRepository.GetTotalCountAsync();

            return new PagedResult<AdminDishResponse>(
                dishes.Select(MapToAdminDishResponse).ToList(),
                page, pageSize, totalCount,
                (int)Math.Ceiling((double)totalCount / pageSize)
            );
        }

        public async Task<AdminDishResponse> UpdateDishStatusAsync(Guid dishId, UpdateDishStatusRequest request)
        {
            var dish = await _dishRepository.GetByIdAsync(dishId)
                ?? throw new InvalidOperationException("Dish not found.");

            dish.IsActive = request.IsActive;
            dish.IsAvailable = request.IsAvailable;
            await _dishRepository.UpdateAsync(dish);

            await LogAuditAsync(dish.Restaurant?.UserId ?? Guid.Empty, "Dish Status Updated",
                $"Dish '{dish.Title}' status updated by admin");

            _logger.LogInformation("Dish {DishId} status updated by admin", dishId);
            return MapToAdminDishResponse(dish);
        }

        public async Task DeleteDishAsync(Guid dishId)
        {
            var dish = await _dishRepository.GetByIdAsync(dishId)
                ?? throw new InvalidOperationException("Dish not found.");

            dish.IsActive = false;
            await _dishRepository.UpdateAsync(dish);

            await LogAuditAsync(dish.Restaurant?.UserId ?? Guid.Empty, "Dish Deleted",
                $"Dish '{dish.Title}' deleted by admin");

            _logger.LogInformation("Dish {DishId} deleted by admin", dishId);
        }

        // ── Order Management ──────────────────────────────────────────────────────

        public async Task<PagedResult<AdminOrderResponse>> GetAllOrdersAsync(int page = 1, int pageSize = 20)
        {
            var skip = (page - 1) * pageSize;
            var orders = await _orderRepository.GetAllAsync(skip, pageSize);
            var totalCount = await _orderRepository.GetTotalOrderCountAsync();

            return new PagedResult<AdminOrderResponse>(
                orders.Select(MapToAdminOrderResponse).ToList(),
                page, pageSize, totalCount,
                (int)Math.Ceiling((double)totalCount / pageSize)
            );
        }

        public async Task<PagedResult<AdminOrderResponse>> GetOrdersByStatusAsync(string status, int page = 1, int pageSize = 20)
        {
            if (!Enum.TryParse<OrderStatus>(status, true, out var orderStatus))
                throw new ArgumentException($"Invalid order status: {status}");

            var skip = (page - 1) * pageSize;
            var orders = await _orderRepository.GetAllByStatusAsync(orderStatus, skip, pageSize);
            var totalCount = await _orderRepository.GetOrderCountByStatusAsync(orderStatus);

            return new PagedResult<AdminOrderResponse>(
                orders.Select(MapToAdminOrderResponse).ToList(),
                page, pageSize, totalCount,
                (int)Math.Ceiling((double)totalCount / pageSize)
            );
        }

        public async Task<AdminOrderResponse> GetOrderByIdAsync(Guid orderId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId)
                ?? throw new InvalidOperationException("Order not found.");

            return MapToAdminOrderResponse(order);
        }

        // ── Review Management ─────────────────────────────────────────────────────

        public async Task<PagedResult<AdminReviewResponse>> GetAllReviewsAsync(int page = 1, int pageSize = 20)
        {
            var skip = (page - 1) * pageSize;
            var reviews = await _reviewRepository.GetAllAsync(skip, pageSize);
            var totalCount = await _reviewRepository.GetTotalCountAsync();

            var mapped = new List<AdminReviewResponse>();
            foreach (var r in reviews)
                mapped.Add(await MapToAdminReviewResponseAsync(r));

            return new PagedResult<AdminReviewResponse>(
                mapped, page, pageSize, totalCount,
                (int)Math.Ceiling((double)totalCount / pageSize)
            );
        }

        public async Task<AdminReviewResponse> UpdateReviewStatusAsync(Guid reviewId, UpdateReviewStatusRequest request)
        {
            var review = await _reviewRepository.GetByIdAsync(reviewId)
                ?? throw new InvalidOperationException("Review not found.");

            review.Status = request.Status;
            await _reviewRepository.UpdateAsync(review);

            await LogAuditAsync(review.AuthorId, "Review Status Updated",
                $"Review {reviewId} status set to {request.Status} by admin. Reason: {request.Reason}");

            _logger.LogInformation("Review {ReviewId} status updated to {Status} by admin", reviewId, request.Status);
            return await MapToAdminReviewResponseAsync(review);
        }

        public async Task DeleteReviewAsync(Guid reviewId)
        {
            var review = await _reviewRepository.GetByIdAsync(reviewId)
                ?? throw new InvalidOperationException("Review not found.");

            await _reviewRepository.DeleteAsync(reviewId);

            await LogAuditAsync(review.AuthorId, "Review Deleted",
                $"Review {reviewId} deleted by admin");

            _logger.LogInformation("Review {ReviewId} deleted by admin", reviewId);
        }

        // ── Audit Logs ────────────────────────────────────────────────────────────

        public async Task<PagedResult<AdminAuditLogResponse>> GetAuditLogsAsync(int page = 1, int pageSize = 50)
        {
            var skip = (page - 1) * pageSize;
            var logs = await _auditLogRepository.GetAllAsync(skip, pageSize);
            var totalCount = await _auditLogRepository.GetTotalCountAsync();

            var mapped = new List<AdminAuditLogResponse>();
            foreach (var log in logs)
            {
                string? username = null;
                if (log.UserId.HasValue)
                {
                    var user = await _authRepository.GetByIdAsync(log.UserId.Value);
                    username = user?.Username;
                }
                mapped.Add(new AdminAuditLogResponse(
                    log.Id, log.UserId, username,
                    log.Action, log.Details,
                    log.IpAddress, log.IsSuccess, log.CreatedAt
                ));
            }

            return new PagedResult<AdminAuditLogResponse>(
                mapped, page, pageSize, totalCount,
                (int)Math.Ceiling((double)totalCount / pageSize)
            );
        }

        public async Task<PagedResult<AdminAuditLogResponse>> GetUserAuditLogsAsync(Guid userId, int page = 1, int pageSize = 50)
        {
            var skip = (page - 1) * pageSize;
            var user = await _authRepository.GetByIdAsync(userId);
            var logs = await _auditLogRepository.GetByUserIdAsync(userId, skip, pageSize);
            var totalCount = await _auditLogRepository.GetCountByUserIdAsync(userId);

            var mapped = logs.Select(log => new AdminAuditLogResponse(
                log.Id, log.UserId, user?.Username,
                log.Action, log.Details,
                log.IpAddress, log.IsSuccess, log.CreatedAt
            )).ToList();

            return new PagedResult<AdminAuditLogResponse>(
                mapped, page, pageSize, totalCount,
                (int)Math.Ceiling((double)totalCount / pageSize)
            );
        }

        // ── Private Helpers ───────────────────────────────────────────────────────

        private static AdminUserResponse MapToAdminUserResponse(Core.Entities.User user, List<string> roles) =>
            new(user.Id, user.Username, user.Email, user.PhoneNumber,
                user.IsActive, user.EmailVerified, roles,
                user.CreatedAt, user.LastLoginAt, user.LastLoginIp,
                user.FailedLoginAttempts, user.IsLockedOut());

        private static AdminRestaurantResponse MapToAdminRestaurantResponse(
            Core.Entities.Restaurant r, int totalOrders, decimal totalRevenue) =>
            new(r.Id, r.UserId, r.User?.Username ?? "Unknown",
                r.RestaurantName, r.RestaurantSlug, r.RestaurantDescription,
                r.RestaurantLogo, r.PhoneNumber, r.Address, r.City, r.Country,
                r.IsActive, r.TotalListings, totalOrders, totalRevenue,
                r.AverageRating, r.ReviewCount, r.CreatedAt);

        private static AdminDishResponse MapToAdminDishResponse(Core.Entities.Dish d) =>
            new(d.Id, d.RestaurantId, d.Restaurant?.RestaurantName ?? "Unknown",
                d.Title, d.Slug, d.Price, d.IsActive, d.IsAvailable, d.IsFeatured,
                d.ViewCount, d.ReviewCount, d.AverageRating, d.CreatedAt);

        private static AdminOrderResponse MapToAdminOrderResponse(Core.Entities.Order o) =>
            new(o.Id, o.OrderNumber, o.CustomerId, o.Customer?.Username ?? "Unknown",
                o.RestaurantId, o.Restaurant?.RestaurantName ?? "Unknown",
                o.TotalAmount, o.Status.ToString(),
                o.OrderItems?.Count ?? 0, o.CreatedAt, o.DeliveredAt);

        private async Task<AdminReviewResponse> MapToAdminReviewResponseAsync(Core.Entities.Review r)
        {
            string? dishTitle = null;
            if (r.DishId.HasValue && r.Dish != null)
                dishTitle = r.Dish.Title;

            string? restaurantName = null;
            if (r.RestaurantId.HasValue && r.Restaurant != null)
                restaurantName = r.Restaurant.RestaurantName;

            return new AdminReviewResponse(
                r.Id, r.AuthorId, r.Author?.Username ?? "Unknown",
                r.DishId, dishTitle,
                r.RestaurantId, restaurantName,
                r.Rating, r.Comment, r.Status,
                r.IsVerifiedPurchase, r.CreatedAt
            );
        }

        private async Task LogAuditAsync(Guid userId, string action, string details)
        {
            var auditLog = new AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Action = action,
                Details = details,
                IpAddress = "Admin",
                CreatedAt = DateTime.UtcNow,
                IsSuccess = true
            };
            await _auditLogRepository.CreateAsync(auditLog);
        }
    }
}