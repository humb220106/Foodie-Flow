

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
                totalUsers, allRestaurants.Count, totalDishes,
                totalOrders, totalReviews, totalRevenue,
                pendingOrders, activeRestaurants, newUsersToday,
                ordersToday, revenueToday,
                last7DaysOrders, last7DaysRevenue
            );
        }

        // ── User Management ───────────────────────────────────────────────────────

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

            var roles = await _authRepository.GetUserRolesAsync(userId);
            return MapToAdminUserResponse(user, roles);
        }

        public async Task DeleteUserAsync(Guid userId)
        {
            var user = await _authRepository.GetByIdAsync(userId)
                ?? throw new InvalidOperationException("User not found.");
            await _authRepository.DeleteAsync(userId);
            await LogAuditAsync(userId, "User Deleted", $"User {user.Username} deleted by admin");
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

            var totalOrders = await _orderRepository.GetTotalOrderCountAsync(restaurantId);
            var totalRevenue = await _orderRepository.GetTotalRevenueAsync(restaurantId);
            return MapToAdminRestaurantResponse(restaurant, totalOrders, totalRevenue);
        }

        public async Task DeleteRestaurantAsync(Guid restaurantId)
        {
            var restaurant = await _restaurantRepository.GetByIdAsync(restaurantId)
                ?? throw new InvalidOperationException("Restaurant not found.");
            restaurant.IsActive = false;
            await _restaurantRepository.UpdateAsync(restaurant);
            await LogAuditAsync(restaurant.UserId, "Restaurant Deleted",
                $"Restaurant '{restaurant.RestaurantName}' deleted by admin");
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
                $"Review {reviewId} status set to {request.Status} by admin.");
            return await MapToAdminReviewResponseAsync(review);
        }

        public async Task DeleteReviewAsync(Guid reviewId)
        {
            var review = await _reviewRepository.GetByIdAsync(reviewId)
                ?? throw new InvalidOperationException("Review not found.");
            await _reviewRepository.DeleteAsync(reviewId);
            await LogAuditAsync(review.AuthorId, "Review Deleted", $"Review {reviewId} deleted by admin");
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
                    log.Action, log.Details, log.IpAddress, log.IsSuccess, log.CreatedAt
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

            return new PagedResult<AdminAuditLogResponse>(
                logs.Select(log => new AdminAuditLogResponse(
                    log.Id, log.UserId, user?.Username,
                    log.Action, log.Details, log.IpAddress, log.IsSuccess, log.CreatedAt
                )).ToList(),
                page, pageSize, totalCount,
                (int)Math.Ceiling((double)totalCount / pageSize)
            );
        }

        // ── Reports ───────────────────────────────────────────────────────────────

        public async Task<RevenueReportResponse> GetRevenueReportAsync(int days = 30)
        {
            var today = DateTime.UtcNow.Date;
            var thisMonthStart = new DateTime(today.Year, today.Month, 1);
            var lastMonthStart = thisMonthStart.AddMonths(-1);
            var lastMonthEnd = thisMonthStart.AddDays(-1);

            var totalRevenue = await _orderRepository.GetTotalRevenueAsync();
            var revenueThisMonth = await _orderRepository.GetRevenueByDateRangeAsync(thisMonthStart, today);
            var revenueLastMonth = await _orderRepository.GetRevenueByDateRangeAsync(lastMonthStart, lastMonthEnd);

            var revenueGrowth = revenueLastMonth == 0
                ? 100m
                : Math.Round((revenueThisMonth - revenueLastMonth) / revenueLastMonth * 100, 2);

            // Daily revenue for last N days
            var dailyRevenue = new List<DailyStatEntry>();
            for (int i = days - 1; i >= 0; i--)
            {
                var date = today.AddDays(-i);
                var rev = await _orderRepository.GetRevenueByDateAsync(date);
                dailyRevenue.Add(new DailyStatEntry(date, rev));
            }

            // Monthly revenue for last 12 months
            var monthlyRevenue = new List<MonthlyStatEntry>();
            for (int i = 11; i >= 0; i--)
            {
                var monthStart = thisMonthStart.AddMonths(-i);
                var monthEnd = monthStart.AddMonths(1).AddDays(-1);
                var rev = await _orderRepository.GetRevenueByDateRangeAsync(monthStart, monthEnd);
                monthlyRevenue.Add(new MonthlyStatEntry(
                    monthStart.Year,
                    monthStart.Month,
                    monthStart.ToString("MMM yyyy"),
                    rev
                ));
            }

            // Top 5 restaurants by revenue
            var allRestaurants = await _restaurantRepository.GetAllAsync(0, int.MaxValue);
            var topRestaurants = new List<TopRestaurantRevenueEntry>();
            foreach (var r in allRestaurants)
            {
                var rev = await _orderRepository.GetTotalRevenueAsync(r.Id);
                var orders = await _orderRepository.GetTotalOrderCountAsync(r.Id);
                topRestaurants.Add(new TopRestaurantRevenueEntry(r.Id, r.RestaurantName, rev, orders));
            }
            topRestaurants = topRestaurants.OrderByDescending(x => x.Revenue).Take(5).ToList();

            return new RevenueReportResponse(
                totalRevenue, revenueThisMonth, revenueLastMonth,
                revenueGrowth, dailyRevenue, monthlyRevenue, topRestaurants
            );
        }

        public async Task<OrdersReportResponse> GetOrdersReportAsync(int days = 30)
        {
            var today = DateTime.UtcNow.Date;
            var thisMonthStart = new DateTime(today.Year, today.Month, 1);
            var lastMonthStart = thisMonthStart.AddMonths(-1);
            var lastMonthEnd = thisMonthStart.AddDays(-1);

            var totalOrders = await _orderRepository.GetTotalOrderCountAsync();
            var ordersThisMonth = await _orderRepository.GetOrdersCountByDateRangeAsync(thisMonthStart, today);
            var ordersLastMonth = await _orderRepository.GetOrdersCountByDateRangeAsync(lastMonthStart, lastMonthEnd);

            var orderGrowth = ordersLastMonth == 0
                ? 100m
                : Math.Round((decimal)(ordersThisMonth - ordersLastMonth) / ordersLastMonth * 100, 2);

            var pendingOrders = await _orderRepository.GetOrderCountByStatusAsync(OrderStatus.Pending);
            var completedOrders = await _orderRepository.GetOrderCountByStatusAsync(OrderStatus.Delivered);
            var cancelledOrders = await _orderRepository.GetOrderCountByStatusAsync(OrderStatus.Cancelled);

            // Daily orders for last N days
            var dailyOrders = new List<DailyStatEntry>();
            for (int i = days - 1; i >= 0; i--)
            {
                var date = today.AddDays(-i);
                var count = await _orderRepository.GetOrdersCountByDateAsync(date);
                dailyOrders.Add(new DailyStatEntry(date, count));
            }

            // Status breakdown
            var statusBreakdown = new List<OrderStatusBreakdown>();
            foreach (OrderStatus status in Enum.GetValues(typeof(OrderStatus)))
            {
                var count = await _orderRepository.GetOrderCountByStatusAsync(status);
                var pct = totalOrders == 0 ? 0m : Math.Round((decimal)count / totalOrders * 100, 1);
                statusBreakdown.Add(new OrderStatusBreakdown(status.ToString(), count, pct));
            }

            return new OrdersReportResponse(
                totalOrders, ordersThisMonth, ordersLastMonth, orderGrowth,
                pendingOrders, completedOrders, cancelledOrders,
                dailyOrders, statusBreakdown
            );
        }

        public async Task<UsersReportResponse> GetUsersReportAsync(int days = 30)
        {
            var today = DateTime.UtcNow.Date;
            var thisMonthStart = new DateTime(today.Year, today.Month, 1);
            var lastMonthStart = thisMonthStart.AddMonths(-1);
            var lastMonthEnd = thisMonthStart.AddDays(-1);

            var allUsers = await _authRepository.GetAllAsync(0, int.MaxValue);
            var totalUsers = allUsers.Count;

            var newThisMonth = allUsers.Count(u => u.CreatedAt.Date >= thisMonthStart);
            var newLastMonth = allUsers.Count(u =>
                u.CreatedAt.Date >= lastMonthStart && u.CreatedAt.Date <= lastMonthEnd);

            var userGrowth = newLastMonth == 0
                ? 100m
                : Math.Round((decimal)(newThisMonth - newLastMonth) / newLastMonth * 100, 2);

            var activeUsers = allUsers.Count(u => u.IsActive);
            var inactiveUsers = allUsers.Count(u => !u.IsActive);

            // Daily signups for last N days
            var dailySignups = new List<DailyStatEntry>();
            for (int i = days - 1; i >= 0; i--)
            {
                var date = today.AddDays(-i);
                var count = allUsers.Count(u => u.CreatedAt.Date == date);
                dailySignups.Add(new DailyStatEntry(date, count));
            }

            // Role breakdown
            var roleNames = new[] { "Admin", "Customer", "Restaurant" };
            var roleBreakdown = new List<RoleBreakdown>();
            foreach (var roleName in roleNames)
            {
                var role = await _roleRepository.GetByNameAsync(roleName);
                if (role == null) continue;
                var count = allUsers.Count(u =>
                    _authRepository.GetUserRolesAsync(u.Id).Result.Contains(roleName));
                roleBreakdown.Add(new RoleBreakdown(roleName, count));
            }

            return new UsersReportResponse(
                totalUsers, newThisMonth, newLastMonth, userGrowth,
                activeUsers, inactiveUsers, dailySignups, roleBreakdown
            );
        }

        public async Task<RestaurantsReportResponse> GetRestaurantsReportAsync()
        {
            var today = DateTime.UtcNow.Date;
            var thisMonthStart = new DateTime(today.Year, today.Month, 1);

            var allRestaurants = await _restaurantRepository.GetAllAsync(0, int.MaxValue);
            var totalRestaurants = allRestaurants.Count;
            var activeRestaurants = allRestaurants.Count(r => r.IsActive);
            var inactiveRestaurants = allRestaurants.Count(r => !r.IsActive);
            var newThisMonth = allRestaurants.Count(r => r.CreatedAt.Date >= thisMonthStart);

            var withStats = new List<(Core.Entities.Restaurant r, int orders, decimal revenue)>();
            foreach (var r in allRestaurants)
            {
                var orders = await _orderRepository.GetTotalOrderCountAsync(r.Id);
                var revenue = await _orderRepository.GetTotalRevenueAsync(r.Id);
                withStats.Add((r, orders, revenue));
            }

            var topByOrders = withStats
                .OrderByDescending(x => x.orders).Take(5)
                .Select(x => new TopRestaurantRevenueEntry(x.r.Id, x.r.RestaurantName, x.revenue, x.orders))
                .ToList();

            var topByRevenue = withStats
                .OrderByDescending(x => x.revenue).Take(5)
                .Select(x => new TopRestaurantRevenueEntry(x.r.Id, x.r.RestaurantName, x.revenue, x.orders))
                .ToList();

            return new RestaurantsReportResponse(
                totalRestaurants, activeRestaurants, inactiveRestaurants,
                newThisMonth, topByOrders, topByRevenue
            );
        }

        public async Task<AdminSummaryReportResponse> GetSummaryReportAsync()
        {
            var revenue = await GetRevenueReportAsync(30);
            var orders = await GetOrdersReportAsync(30);
            var users = await GetUsersReportAsync(30);
            var restaurants = await GetRestaurantsReportAsync();

            return new AdminSummaryReportResponse(revenue, orders, users, restaurants);
        }

        // ── Private helpers ───────────────────────────────────────────────────────

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

        private async Task<AdminReviewResponse> MapToAdminReviewResponseAsync(Core.Entities.Review r) =>
            new(r.Id, r.AuthorId, r.Author?.Username ?? "Unknown",
                r.DishId, r.Dish?.Title,
                r.RestaurantId, r.Restaurant?.RestaurantName,
                r.Rating, r.Comment, r.Status,
                r.IsVerifiedPurchase, r.CreatedAt);

        private async Task LogAuditAsync(Guid userId, string action, string details)
        {
            await _auditLogRepository.CreateAsync(new Core.Entities.AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Action = action,
                Details = details,
                IpAddress = "Admin",
                CreatedAt = DateTime.UtcNow,
                IsSuccess = true
            });
        }
    }
}