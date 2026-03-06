using FoodOrdering.Application.Repositories;
using FoodOrdering.Core.Entities;
using FoodOrdering.Core.Enums;
using FoodOrdering.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FoodOrdering.Infrastructure.Repositories
{
    public class OrderRepository : IOrderRepository
    {
        private readonly AppDbContext _context;

        public OrderRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Order> CreateAsync(Order order)
        {
            await _context.Orders.AddAsync(order);
            await _context.SaveChangesAsync();
            return order;
        }

        public async Task<Order> UpdateAsync(Order order)
        {
            order.UpdatedAt = DateTime.UtcNow;
            _context.Orders.Update(order);
            await _context.SaveChangesAsync();
            return order;
        }

        public async Task<Order?> GetByIdAsync(Guid id)
        {
            return await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Restaurant)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Dish)
                .FirstOrDefaultAsync(o => o.Id == id);
        }

        public async Task<Order?> GetByOrderNumberAsync(string orderNumber)
        {
            return await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Restaurant)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Dish)
                .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber);
        }

        public async Task<List<Order>> GetCustomerOrdersAsync(Guid customerId, int skip = 0, int take = 20)
        {
            return await _context.Orders
                .Include(o => o.Restaurant)
                .Include(o => o.OrderItems)
                .Where(o => o.CustomerId == customerId)
                .OrderByDescending(o => o.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<List<Order>> GetRestaurantOrdersAsync(Guid restaurantId, int skip = 0, int take = 20)
        {
            return await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Dish)
                .Where(o => o.RestaurantId == restaurantId)
                .OrderByDescending(o => o.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<List<Order>> GetRestaurantOrdersByStatusAsync(Guid restaurantId, OrderStatus status, int skip = 0, int take = 20)
        {
            return await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Dish)
                .Where(o => o.RestaurantId == restaurantId && o.Status == status)
                .OrderByDescending(o => o.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<List<Order>> GetActiveOrdersForCustomerAsync(Guid customerId)
        {
            var activeStatuses = new[]
            {
                OrderStatus.Pending,
                OrderStatus.Accepted,
                OrderStatus.Preparing,
                OrderStatus.Ready,
                OrderStatus.PickedUp,
                OrderStatus.OnTheWay
            };

            return await _context.Orders
                .Include(o => o.Restaurant)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Dish)
                .Where(o => o.CustomerId == customerId && activeStatuses.Contains(o.Status))
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Order>> GetActiveOrdersForRestaurantAsync(Guid restaurantId)
        {
            var activeStatuses = new[]
            {
                OrderStatus.Pending,
                OrderStatus.Accepted,
                OrderStatus.Preparing,
                OrderStatus.Ready,
                OrderStatus.PickedUp,
                OrderStatus.OnTheWay
            };

            return await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Dish)
                .Where(o => o.RestaurantId == restaurantId && activeStatuses.Contains(o.Status))
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
        }

        public async Task<int> GetTotalOrderCountAsync(Guid restaurantId)
        {
            return await _context.Orders
                .Where(o => o.RestaurantId == restaurantId &&
                           o.Status != OrderStatus.Cancelled &&
                           o.Status != OrderStatus.Rejected)
                .CountAsync();
        }

        public async Task<decimal> GetTotalRevenueAsync(Guid restaurantId)
        {
            return await _context.Orders
                .Where(o => o.RestaurantId == restaurantId &&
                           
                           (o.Status == OrderStatus.Delivered || o.Status == OrderStatus.Completed))
                .SumAsync(o => o.TotalAmount);
        }

        public async Task<int> GetOrderCountByStatusAsync(Guid restaurantId, OrderStatus status)
        {
            return await _context.Orders
                .Where(o => o.RestaurantId == restaurantId && o.Status == status)
                .CountAsync();
        }

        public async Task<bool> CanCustomerReviewOrderAsync(Guid orderId, Guid customerId)
        {
            var order = await _context.Orders
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null || order.CustomerId != customerId)
                return false;

            if (order.Status != OrderStatus.Delivered && order.Status != OrderStatus.Completed)
                return false;

            if (order.Rating.HasValue)
                return false; // Already reviewed

            return true;
        }

        public async Task<bool> IsOrderNumberUniqueAsync(string orderNumber)
        {
            return !await _context.Orders.AnyAsync(o => o.OrderNumber == orderNumber);
        }
        public async Task<List<Order>> GetAllAsync(int skip, int take)
        {
            return await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Restaurant)
                .Include(o => o.OrderItems)
                .OrderByDescending(o => o.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<List<Order>> GetAllByStatusAsync(OrderStatus status, int skip, int take)
        {
            return await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Restaurant)
                .Include(o => o.OrderItems)
                .Where(o => o.Status == status)
                .OrderByDescending(o => o.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        // Parameterless overload for admin (all restaurants)
        public async Task<int> GetTotalOrderCountAsync()
        {
            return await _context.Orders.CountAsync();
        }

        public async Task<decimal> GetTotalRevenueAsync()
        {
            return await _context.Orders
                .Where(o => o.Status == OrderStatus.Delivered || o.Status == OrderStatus.Completed)
                .SumAsync(o => o.TotalAmount);
        }

        
        public async Task<int> GetOrderCountByStatusAsync(OrderStatus status)
        {
            return await _context.Orders
                .CountAsync(o => o.Status == status);
        }

        public async Task<int> GetOrdersCountByDateAsync(DateTime date)
        {
            return await _context.Orders
                .CountAsync(o => o.CreatedAt.Date == date.Date);
        }

        public async Task<decimal> GetRevenueByDateAsync(DateTime date)
        {
            return await _context.Orders
                .Where(o => o.CreatedAt.Date == date.Date &&
                            (o.Status == OrderStatus.Delivered || o.Status == OrderStatus.Completed))
                .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;
        }
    }
}