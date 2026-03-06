using FoodOrdering.Application.DTOs.Order;
using FoodOrdering.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.Interfaces
{
    public interface IOrderService
    {
        Task<CreateOrderResponse> CreateOrderAsync(Guid customerId, CreateOrderRequest request);
        Task<OrderResponse> GetOrderByIdAsync(Guid orderId, Guid userId);
        Task<OrderResponse> GetOrderByNumberAsync(string orderNumber, Guid userId);
        Task<List<OrderSummaryResponse>> GetMyOrdersAsync(Guid customerId, int page = 1, int pageSize = 20);
        Task<List<OrderSummaryResponse>> GetRestaurantOrdersAsync(Guid restaurantId, int page = 1, int pageSize = 20);
        Task<List<OrderSummaryResponse>> GetRestaurantOrdersByStatusAsync(Guid restaurantId, OrderStatus status, int page = 1, int pageSize = 20);
        Task<List<OrderResponse>> GetActiveOrdersForCustomerAsync(Guid customerId);
        Task<List<OrderResponse>> GetActiveOrdersForRestaurantAsync(Guid restaurantId);
        Task<OrderResponse> UpdateOrderStatusAsync(Guid orderId, Guid restaurantId, UpdateOrderStatusRequest request);
        Task<OrderResponse> AcceptOrderAsync(Guid orderId, Guid restaurantId, DateTime? estimatedPreparationTime = null);
        Task<OrderResponse> RejectOrderAsync(Guid orderId, Guid restaurantId, string reason);
        Task<OrderResponse> MarkAsPreparingAsync(Guid orderId, Guid restaurantId);
        Task<OrderResponse> MarkAsReadyAsync(Guid orderId, Guid restaurantId);
        Task<OrderResponse> MarkAsDeliveredAsync(Guid orderId, Guid restaurantId);
        Task<OrderResponse> MarkAsPickedUpAsync(Guid orderId, Guid restaurantId);
        Task<OrderResponse> CancelOrderAsync(Guid orderId, Guid userId, CancelOrderRequest request);
        Task<OrderResponse> AddReviewAsync(Guid orderId, Guid customerId, AddOrderReviewRequest request);
        Task<OrderResponse> ConfirmPaymentAsync(Guid orderId, string paymentReference);


    }
}
