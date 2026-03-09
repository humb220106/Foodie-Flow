

using FoodOrdering.Core.Entities;
using FoodOrdering.Core.Enums;

namespace FoodOrdering.Application.Repositories
{
    public interface IOrderRepository
    {
        Task<Order> CreateAsync(Order order);
        Task<Order> UpdateAsync(Order order);
        Task<Order?> GetByIdAsync(Guid id);
        Task<Order?> GetByOrderNumberAsync(string orderNumber);
        Task<List<Order>> GetCustomerOrdersAsync(Guid customerId, int skip = 0, int take = 20);
        Task<List<Order>> GetRestaurantOrdersAsync(Guid restaurantId, int skip = 0, int take = 20);
        Task<List<Order>> GetRestaurantOrdersByStatusAsync(Guid restaurantId, OrderStatus status, int skip = 0, int take = 20);
        Task<List<Order>> GetActiveOrdersForCustomerAsync(Guid customerId);
        Task<List<Order>> GetActiveOrdersForRestaurantAsync(Guid restaurantId);
        Task<int> GetTotalOrderCountAsync(Guid restaurantId);
        Task<decimal> GetTotalRevenueAsync(Guid restaurantId);
        Task<int> GetOrderCountByStatusAsync(Guid restaurantId, OrderStatus status);
        Task<bool> CanCustomerReviewOrderAsync(Guid orderId, Guid customerId);
        Task<bool> IsOrderNumberUniqueAsync(string orderNumber);
        Task<List<Order>> GetAllAsync(int skip, int take);
        Task<List<Order>> GetAllByStatusAsync(OrderStatus status, int skip, int take);
        Task<int> GetTotalOrderCountAsync();
        Task<decimal> GetTotalRevenueAsync();
        Task<int> GetOrderCountByStatusAsync(OrderStatus status);
        Task<int> GetOrdersCountByDateAsync(DateTime date);
        Task<decimal> GetRevenueByDateAsync(DateTime date);

        // ── used by admin reports ──────────────────────────────────────────────
        Task<decimal> GetRevenueByDateRangeAsync(DateTime startDate, DateTime endDate);
        Task<int> GetOrdersCountByDateRangeAsync(DateTime startDate, DateTime endDate);
    }
}