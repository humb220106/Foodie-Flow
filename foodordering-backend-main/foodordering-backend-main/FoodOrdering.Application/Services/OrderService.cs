using FoodOrdering.Application.DTOs.Order;
using FoodOrdering.Application.Interfaces;
using FoodOrdering.Application.Repositories;
using FoodOrdering.Core.Entities;
using FoodOrdering.Core.Enums;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FoodOrdering.Application.Services
{
    public class OrderService : IOrderService
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IDishRepository _dishRepository;
        private readonly IRestaurantRepository _restaurantRepository;
        private readonly IAuthRepository _authRepository;
        private readonly IAuditLogRepository _auditLogRepository;
        private readonly ILogger<OrderService> _logger;

        public OrderService(
            IOrderRepository orderRepository,
            IDishRepository dishRepository,
            IRestaurantRepository restaurantRepository,
            IAuthRepository authRepository,
            IAuditLogRepository auditLogRepository,
            ILogger<OrderService> logger)
        {
            _orderRepository = orderRepository;
            _dishRepository = dishRepository;
            _restaurantRepository = restaurantRepository;
            _authRepository = authRepository;
            _auditLogRepository = auditLogRepository;
            _logger = logger;
        }

        public async Task<CreateOrderResponse> CreateOrderAsync(Guid customerId, CreateOrderRequest request)
        {
            // Validate customer exists
            var customer = await _authRepository.GetByIdAsync(customerId);
            if (customer == null)
                throw new InvalidOperationException("Customer not found");

            // Validate restaurant exists and is active
            var restaurant = await _restaurantRepository.GetByIdAsync(request.RestaurantId);
            if (restaurant == null)
                throw new InvalidOperationException("Restaurant not found");

            if (!restaurant.IsActive)
                throw new InvalidOperationException("Restaurant is currently not accepting orders");

            // Validate delivery information for delivery orders
            

            // Validate and calculate order items
            var orderItems = new List<OrderItem>();
            decimal subTotal = 0;

            foreach (var itemRequest in request.Items)
            {
                var dish = await _dishRepository.GetByIdAsync(itemRequest.DishId);
                if (dish == null)
                    throw new InvalidOperationException($"Dish not found: {itemRequest.DishId}");

                if (dish.RestaurantId != request.RestaurantId)
                    throw new InvalidOperationException($"All items must be from the same restaurant");

                if (!dish.IsAvailable || !dish.IsActive)
                    throw new InvalidOperationException($"Dish '{dish.Title}' is not available");

                var itemSubTotal = dish.Price * itemRequest.Quantity;
                subTotal += itemSubTotal;

                var orderItem = new OrderItem
                {
                    Id = Guid.NewGuid(),
                    DishId = dish.Id,
                    DishName = dish.Title,
                    DishImage = dish.PrimaryImage,
                    UnitPrice = dish.Price,
                    Quantity = itemRequest.Quantity,
                    SpecialInstructions = itemRequest.SpecialInstructions,
                    Customizations = itemRequest.Customizations,
                    SubTotal = itemSubTotal,
                    CreatedAt = DateTime.UtcNow
                };

                orderItems.Add(orderItem);
            }

            // Calculate fees and totals
            
            decimal serviceFee = CalculateServiceFee(subTotal);
            decimal tax = CalculateTax(subTotal);
            decimal discount = 0; // TODO: Implement coupon logic

            decimal totalAmount = subTotal + serviceFee + tax - discount;

            // Generate unique order number
            string orderNumber = await GenerateOrderNumberAsync();

            // Create order
            var order = new Order
            {
                Id = Guid.NewGuid(),
                OrderNumber = orderNumber,
                CustomerId = customerId,
                RestaurantId = request.RestaurantId,
                OrderItems = orderItems,
                SubTotal = subTotal,
               
                ServiceFee = serviceFee,
                Tax = tax,
                Discount = discount,
                TotalAmount = totalAmount,
                
                DeliveryAddress = request.DeliveryAddress ?? string.Empty,
                DeliveryCity = request.DeliveryCity ?? string.Empty,
                DeliveryState = request.DeliveryState ?? string.Empty,
                DeliveryPostalCode = request.DeliveryPostalCode ?? string.Empty,
                DeliveryInstructions = request.DeliveryInstructions,
                DeliveryLatitude = request.DeliveryLatitude,
                DeliveryLongitude = request.DeliveryLongitude,
                CustomerPhone = request.CustomerPhone,
                Status = OrderStatus.Pending,
               
               
                CustomerNotes = request.CustomerNotes,
                EstimatedDeliveryTime = CalculateEstimatedDeliveryTime(),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var createdOrder = await _orderRepository.CreateAsync(order);

            // Log audit
            await LogAuditAsync(customerId, "Order Created", $"Order #{orderNumber} - Total: {totalAmount:C}", "System", true);

            _logger.LogInformation("Order created: {OrderNumber} by customer {CustomerId}", orderNumber, customerId);

            return new CreateOrderResponse(
                createdOrder.Id,
                createdOrder.OrderNumber,
                createdOrder.TotalAmount,
                createdOrder.Status,
                createdOrder.CreatedAt,
                createdOrder.EstimatedDeliveryTime
            );
        }

        public async Task<OrderResponse> GetOrderByIdAsync(Guid orderId, Guid userId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
                throw new InvalidOperationException("Order not found");

            // Check if user has permission to view this order
            if (order.CustomerId != userId && order.Restaurant.UserId != userId)
            {
                var userRoles = await _authRepository.GetUserRolesAsync(userId);
                if (!userRoles.Contains("Admin"))
                    throw new UnauthorizedAccessException("You don't have permission to view this order");
            }

            return MapToOrderResponse(order);
        }

        public async Task<OrderResponse> GetOrderByNumberAsync(string orderNumber, Guid userId)
        {
            var order = await _orderRepository.GetByOrderNumberAsync(orderNumber);
            if (order == null)
                throw new InvalidOperationException("Order not found");

            // Check permissions
            if (order.CustomerId != userId && order.Restaurant.UserId != userId)
            {
                var userRoles = await _authRepository.GetUserRolesAsync(userId);
                if (!userRoles.Contains("Admin"))
                    throw new UnauthorizedAccessException("You don't have permission to view this order");
            }

            return MapToOrderResponse(order);
        }

        public async Task<List<OrderSummaryResponse>> GetMyOrdersAsync(Guid customerId, int page = 1, int pageSize = 20)
        {
            var skip = (page - 1) * pageSize;
            var orders = await _orderRepository.GetCustomerOrdersAsync(customerId, skip, pageSize);

            return orders.Select(MapToOrderSummary).ToList();
        }

        public async Task<List<OrderSummaryResponse>> GetRestaurantOrdersAsync(Guid restaurantId, int page = 1, int pageSize = 20)
        {
            var skip = (page - 1) * pageSize;
            var orders = await _orderRepository.GetRestaurantOrdersAsync(restaurantId, skip, pageSize);

            return orders.Select(MapToOrderSummary).ToList();
        }

        public async Task<List<OrderSummaryResponse>> GetRestaurantOrdersByStatusAsync(Guid restaurantId, OrderStatus status, int page = 1, int pageSize = 20)
        {
            var skip = (page - 1) * pageSize;
            var orders = await _orderRepository.GetRestaurantOrdersByStatusAsync(restaurantId, status, skip, pageSize);

            return orders.Select(MapToOrderSummary).ToList();
        }

        public async Task<List<OrderResponse>> GetActiveOrdersForCustomerAsync(Guid customerId)
        {
            var orders = await _orderRepository.GetActiveOrdersForCustomerAsync(customerId);
            return orders.Select(MapToOrderResponse).ToList();
        }

        public async Task<List<OrderResponse>> GetActiveOrdersForRestaurantAsync(Guid restaurantId)
        {
            var orders = await _orderRepository.GetActiveOrdersForRestaurantAsync(restaurantId);
            return orders.Select(MapToOrderResponse).ToList();
        }

        public async Task<OrderResponse> UpdateOrderStatusAsync(Guid orderId, Guid restaurantId, UpdateOrderStatusRequest request)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
                throw new InvalidOperationException("Order not found");

            if (order.RestaurantId != restaurantId)
                throw new UnauthorizedAccessException("You don't have permission to update this order");

            // Validate status transition
            ValidateStatusTransition(order.Status, request.Status);

            order.Status = request.Status;
            order.UpdatedAt = DateTime.UtcNow;

            // Update timestamps based on status
            switch (request.Status)
            {
                case OrderStatus.Accepted:
                    order.AcceptedAt = DateTime.UtcNow;
                    order.EstimatedPreparationTime = request.EstimatedPreparationTime;
                    break;
                case OrderStatus.Preparing:
                    order.PreparingAt = DateTime.UtcNow;
                    break;
                case OrderStatus.Ready:
                    order.ReadyAt = DateTime.UtcNow;
                    break;
                case OrderStatus.PickedUp:
                    order.PickedUpAt = DateTime.UtcNow;
                    break;
                case OrderStatus.Delivered:
                    order.DeliveredAt = DateTime.UtcNow;
                    break;
                case OrderStatus.Rejected:
                case OrderStatus.Cancelled:
                    order.CancelledAt = DateTime.UtcNow;
                    order.CancellationReason = request.Notes;
                    break;
            }

            if (request.EstimatedDeliveryTime.HasValue)
                order.EstimatedDeliveryTime = request.EstimatedDeliveryTime;

            if (!string.IsNullOrWhiteSpace(request.Notes))
                order.RestaurantNotes = request.Notes;

            await _orderRepository.UpdateAsync(order);

            await LogAuditAsync(order.Restaurant.UserId, "Order Status Updated",
                $"Order #{order.OrderNumber} - Status: {request.Status}", "System", true);

            _logger.LogInformation("Order {OrderNumber} status updated to {Status}", order.OrderNumber, request.Status);

            return MapToOrderResponse(order);
        }

        public async Task<OrderResponse> AcceptOrderAsync(Guid orderId, Guid restaurantId, DateTime? estimatedPreparationTime = null)
        {
            var request = new UpdateOrderStatusRequest
            {
                Status = OrderStatus.Accepted,
                EstimatedPreparationTime = estimatedPreparationTime ?? DateTime.UtcNow.AddMinutes(30)
            };

            return await UpdateOrderStatusAsync(orderId, restaurantId, request);
        }

        public async Task<OrderResponse> RejectOrderAsync(Guid orderId, Guid restaurantId, string reason)
        {
            var request = new UpdateOrderStatusRequest
            {
                Status = OrderStatus.Rejected,
                Notes = reason
            };

            return await UpdateOrderStatusAsync(orderId, restaurantId, request);
        }

        public async Task<OrderResponse> MarkAsPreparingAsync(Guid orderId, Guid restaurantId)
        {
            var request = new UpdateOrderStatusRequest { Status = OrderStatus.Preparing };
            return await UpdateOrderStatusAsync(orderId, restaurantId, request);
        }

        public async Task<OrderResponse> MarkAsReadyAsync(Guid orderId, Guid restaurantId)
        {
            var request = new UpdateOrderStatusRequest { Status = OrderStatus.Ready };
            return await UpdateOrderStatusAsync(orderId, restaurantId, request);
        }

        public async Task<OrderResponse> MarkAsPickedUpAsync(Guid orderId, Guid restaurantId)
        {
            var request = new UpdateOrderStatusRequest { Status = OrderStatus.PickedUp };
            return await UpdateOrderStatusAsync(orderId, restaurantId, request);
        }

        public async Task<OrderResponse> MarkAsDeliveredAsync(Guid orderId, Guid restaurantId)
        {
            var request = new UpdateOrderStatusRequest { Status = OrderStatus.Delivered };
            return await UpdateOrderStatusAsync(orderId, restaurantId, request);
        }

        public async Task<OrderResponse> CancelOrderAsync(Guid orderId, Guid userId, CancelOrderRequest request)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
                throw new InvalidOperationException("Order not found");

            // Check if user has permission (customer or restaurant owner)
            if (order.CustomerId != userId && order.Restaurant.UserId != userId)
                throw new UnauthorizedAccessException("You don't have permission to cancel this order");

            // Check if order can be cancelled
            if (order.Status == OrderStatus.Delivered || order.Status == OrderStatus.Completed)
                throw new InvalidOperationException("Cannot cancel a delivered or completed order");

            if (order.Status == OrderStatus.Cancelled)
                throw new InvalidOperationException("Order is already cancelled");

            order.Status = OrderStatus.Cancelled;
            order.CancelledAt = DateTime.UtcNow;
            order.CancellationReason = request.Reason;
            order.UpdatedAt = DateTime.UtcNow;

            await _orderRepository.UpdateAsync(order);

            await LogAuditAsync(userId, "Order Cancelled",
                $"Order #{order.OrderNumber} - Reason: {request.Reason}", "System", true);

            _logger.LogInformation("Order {OrderNumber} cancelled by user {UserId}", order.OrderNumber, userId);

            return MapToOrderResponse(order);
        }

        public async Task<OrderResponse> AddReviewAsync(Guid orderId, Guid customerId, AddOrderReviewRequest request)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
                throw new InvalidOperationException("Order not found");

            if (order.CustomerId != customerId)
                throw new UnauthorizedAccessException("You can only review your own orders");

            if (order.Status != OrderStatus.Delivered && order.Status != OrderStatus.Completed)
                throw new InvalidOperationException("You can only review delivered orders");

            if (order.Rating.HasValue)
                throw new InvalidOperationException("You have already reviewed this order");

            order.Rating = request.Rating;
            order.Review = request.Review;
            order.ReviewedAt = DateTime.UtcNow;
            order.UpdatedAt = DateTime.UtcNow;

            await _orderRepository.UpdateAsync(order);

            // Update restaurant rating (this would typically be done in a separate service)
            // TODO: Implement restaurant rating calculation

            await LogAuditAsync(customerId, "Order Reviewed",
                $"Order #{order.OrderNumber} - Rating: {request.Rating}/5", "System", true);

            _logger.LogInformation("Order {OrderNumber} reviewed by customer {CustomerId}", order.OrderNumber, customerId);

            return MapToOrderResponse(order);
        }

        public async Task<OrderResponse> ConfirmPaymentAsync(Guid orderId, string paymentReference)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
                throw new InvalidOperationException("Order not found");

            if (order.Status == OrderStatus.Cancelled || order.Status == OrderStatus.Rejected)
                throw new InvalidOperationException("Cannot process payment for a cancelled or rejected order");

            if (order.IsPaid)
                throw new InvalidOperationException("Order has already been paid");

            // Dummy payment: simulate payment processing
            order.IsPaid = true;
            order.PaymentReference = paymentReference ?? $"DUMMY-PAY-{Guid.NewGuid().ToString("N").Substring(0, 10).ToUpper()}";
            order.PaymentMethod = "Dummy Payment";
            order.PaidAt = DateTime.UtcNow;
            order.UpdatedAt = DateTime.UtcNow;

            await _orderRepository.UpdateAsync(order);

            await LogAuditAsync(order.CustomerId, "Payment Confirmed",
                $"Order #{order.OrderNumber} - Ref: {order.PaymentReference} - Amount: {order.TotalAmount:C}",
                "System", true);

            _logger.LogInformation("Dummy payment confirmed for order {OrderNumber} with reference {PaymentReference}",
                order.OrderNumber, order.PaymentReference);

            return MapToOrderResponse(order);
        }

        // Helper methods
        private decimal CalculateDeliveryFee(decimal subTotal)
        {
            // Simple logic - you can make this more sophisticated
            if (subTotal >= 5000) return 0; // Free delivery over 5000
            return 500; // Flat 500 delivery fee
        }

        private decimal CalculateServiceFee(decimal subTotal)
        {
            // 5% service fee
            return Math.Round(subTotal * 0.05m, 2);
        }

        private decimal CalculateTax(decimal subTotal)
        {
            // 7.5% VAT
            return Math.Round(subTotal * 0.075m, 2);
        }

        private DateTime CalculateEstimatedDeliveryTime()
        {
            // Simple logic: 45 minutes from now
            return DateTime.UtcNow.AddMinutes(45);
        }

        private async Task<string> GenerateOrderNumberAsync()
        {
            string orderNumber;
            bool isUnique;

            do
            {
                // Format: ORD-YYYYMMDD-XXXXX
                var datePart = DateTime.UtcNow.ToString("yyyyMMdd");
                var randomPart = new Random().Next(10000, 99999);
                orderNumber = $"ORD-{datePart}-{randomPart}";

                isUnique = await _orderRepository.IsOrderNumberUniqueAsync(orderNumber);
            } while (!isUnique);

            return orderNumber;
        }

        private void ValidateStatusTransition(OrderStatus currentStatus, OrderStatus newStatus)
        {
            // Define allowed transitions
            var allowedTransitions = new Dictionary<OrderStatus, List<OrderStatus>>
            {
                { OrderStatus.Pending, new List<OrderStatus> { OrderStatus.Accepted, OrderStatus.Rejected, OrderStatus.Cancelled } },
                { OrderStatus.Accepted, new List<OrderStatus> { OrderStatus.Preparing, OrderStatus.Cancelled } },
                { OrderStatus.Preparing, new List<OrderStatus> { OrderStatus.Ready, OrderStatus.Cancelled } },
                { OrderStatus.Ready, new List<OrderStatus> { OrderStatus.PickedUp, OrderStatus.Delivered } },
                { OrderStatus.PickedUp, new List<OrderStatus> { OrderStatus.OnTheWay } },
                { OrderStatus.OnTheWay, new List<OrderStatus> { OrderStatus.Delivered } },
                { OrderStatus.Delivered, new List<OrderStatus> { OrderStatus.Completed } }
            };

            if (!allowedTransitions.ContainsKey(currentStatus) ||
                !allowedTransitions[currentStatus].Contains(newStatus))
            {
                throw new InvalidOperationException(
                    $"Cannot transition from {currentStatus} to {newStatus}");
            }
        }

        private OrderResponse MapToOrderResponse(Order order)
        {
            return new OrderResponse
            {
                Id = order.Id,
                OrderNumber = order.OrderNumber,
                CustomerId = order.CustomerId,
                CustomerName = order.Customer?.Username ?? "Unknown",
                CustomerPhone = order.CustomerPhone,
                RestaurantId = order.RestaurantId,
                RestaurantName = order.Restaurant?.RestaurantName ?? "Unknown",
                RestaurantLogo = order.Restaurant?.RestaurantLogo,
                Items = order.OrderItems.Select(item => new OrderItemResponse
                {
                    Id = item.Id,
                    DishId = item.DishId,
                    DishName = item.DishName,
                    DishImage = item.DishImage,
                    UnitPrice = item.UnitPrice,
                    Quantity = item.Quantity,
                    SubTotal = item.SubTotal,
                    SpecialInstructions = item.SpecialInstructions,
                    Customizations = item.Customizations
                }).ToList(),
                SubTotal = order.SubTotal,
                DeliveryFee = order.DeliveryFee,
                ServiceFee = order.ServiceFee,
                Tax = order.Tax,
                Discount = order.Discount,
                TotalAmount = order.TotalAmount,
               
                DeliveryAddress = order.DeliveryAddress,
                DeliveryCity = order.DeliveryCity,
                DeliveryState = order.DeliveryState,
                DeliveryInstructions = order.DeliveryInstructions,
                Status = order.Status,
               
                PaymentMethod = order.PaymentMethod,
                CreatedAt = order.CreatedAt,
                AcceptedAt = order.AcceptedAt,
                PreparingAt = order.PreparingAt,
                ReadyAt = order.ReadyAt,
                DeliveredAt = order.DeliveredAt,
                EstimatedDeliveryTime = order.EstimatedDeliveryTime,
                CustomerNotes = order.CustomerNotes,
                RestaurantNotes = order.RestaurantNotes,
                Rating = order.Rating,
                Review = order.Review
            };
        }

        private OrderSummaryResponse MapToOrderSummary(Order order)
        {
            return new OrderSummaryResponse
            {
                Id = order.Id,
                OrderNumber = order.OrderNumber,
                RestaurantId = order.RestaurantId,
                RestaurantName = order.Restaurant?.RestaurantName ?? "Unknown",
                RestaurantLogo = order.Restaurant?.RestaurantLogo,
                ItemCount = order.OrderItems?.Count ?? 0,
                TotalAmount = order.TotalAmount,
                Status = order.Status,
                CreatedAt = order.CreatedAt,
                EstimatedDeliveryTime = order.EstimatedDeliveryTime
            };
        }

        private async Task LogAuditAsync(Guid userId, string action, string details, string ipAddress, bool isSuccess)
        {
            var auditLog = new Core.Entities.AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Action = action,
                Details = details,
                IpAddress = ipAddress,
                CreatedAt = DateTime.UtcNow,
                IsSuccess = isSuccess
            };

            await _auditLogRepository.CreateAsync(auditLog);
        }
    }
}