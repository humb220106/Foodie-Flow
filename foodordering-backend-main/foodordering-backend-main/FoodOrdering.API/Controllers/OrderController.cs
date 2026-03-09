using FoodOrdering.Application.DTOs.Order;
using FoodOrdering.Application.Interfaces;
using FoodOrdering.Core.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Threading.Tasks;

namespace FoodOrdering.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrderController : ControllerBase
    {
        private readonly IOrderService _orderService;
        private readonly IRestaurantService _restaurantService;
        private readonly ILogger<OrderController> _logger;

        public OrderController(
            IOrderService orderService,
            IRestaurantService restaurantService,
            ILogger<OrderController> logger)
        {
            _orderService = orderService;
            _restaurantService = restaurantService;
            _logger = logger;
        }

        // Create Order (Customer only)
        [HttpPost]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
        {
            try
            {
                var customerId = GetCurrentUserId();
                var result = await _orderService.CreateOrderAsync(customerId, request);

                return CreatedAtAction(
                    nameof(GetOrderById),
                    new { id = result.OrderId },
                    new { message = "Order created successfully", data = result }
                );
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Failed to create order");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating order");
                return StatusCode(500, new { message = "An error occurred while creating the order" });
            }
        }

        // Get Order by ID
        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetOrderById(Guid id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var order = await _orderService.GetOrderByIdAsync(id, userId);
                return Ok(new { data = order });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving order {OrderId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the order" });
            }
        }

        // Get Order by Order Number
        [HttpGet("number/{orderNumber}")]
        [Authorize]
        public async Task<IActionResult> GetOrderByNumber(string orderNumber)
        {
            try
            {
                var userId = GetCurrentUserId();
                var order = await _orderService.GetOrderByNumberAsync(orderNumber, userId);
                return Ok(new { data = order });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving order {OrderNumber}", orderNumber);
                return StatusCode(500, new { message = "An error occurred while retrieving the order" });
            }
        }

        // Get My Orders (Customer)
        [HttpGet("my-orders")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetMyOrders(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var customerId = GetCurrentUserId();

                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 20;

                var orders = await _orderService.GetMyOrdersAsync(customerId, page, pageSize);

                return Ok(new { data = orders, page, pageSize, count = orders.Count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving customer orders");
                return StatusCode(500, new { message = "An error occurred while retrieving your orders" });
            }
        }

        // Get Active Orders for Customer
        [HttpGet("my-orders/active")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetMyActiveOrders()
        {
            try
            {
                var customerId = GetCurrentUserId();
                var orders = await _orderService.GetActiveOrdersForCustomerAsync(customerId);
                return Ok(new { data = orders });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active orders for customer");
                return StatusCode(500, new { message = "An error occurred while retrieving your active orders" });
            }
        }

        // Get Restaurant Orders (Restaurant Owner)
        [HttpGet("restaurant")]
        [Authorize(Roles = "Restaurant")]
        public async Task<IActionResult> GetRestaurantOrders(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var userId = GetCurrentUserId();
                var restaurant = await GetUserRestaurantOrNotFound(userId);
                if (restaurant == null)
                    return NotFound(new { message = "Restaurant not found for this user" });

                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 20;

                var orders = await _orderService.GetRestaurantOrdersAsync(restaurant.Id, page, pageSize);

                return Ok(new { data = orders, page, pageSize, count = orders.Count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving restaurant orders");
                return StatusCode(500, new { message = "An error occurred while retrieving orders" });
            }
        }

        // Get Restaurant Orders by Status
        [HttpGet("restaurant/status/{status}")]
        [Authorize(Roles = "Restaurant")]
        public async Task<IActionResult> GetRestaurantOrdersByStatus(
            OrderStatus status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var userId = GetCurrentUserId();
                var restaurant = await GetUserRestaurantOrNotFound(userId);
                if (restaurant == null)
                    return NotFound(new { message = "Restaurant not found for this user" });

                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 20;

                var orders = await _orderService.GetRestaurantOrdersByStatusAsync(restaurant.Id, status, page, pageSize);

                return Ok(new { data = orders, page, pageSize, count = orders.Count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving restaurant orders by status");
                return StatusCode(500, new { message = "An error occurred while retrieving orders" });
            }
        }

        // Get Active Orders for Restaurant
        [HttpGet("restaurant/active")]
        [Authorize(Roles = "Restaurant")]
        public async Task<IActionResult> GetRestaurantActiveOrders()
        {
            try
            {
                var userId = GetCurrentUserId();
                var restaurant = await GetUserRestaurantOrNotFound(userId);
                if (restaurant == null)
                    return NotFound(new { message = "Restaurant not found for this user" });

                var orders = await _orderService.GetActiveOrdersForRestaurantAsync(restaurant.Id);
                return Ok(new { data = orders });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active restaurant orders");
                return StatusCode(500, new { message = "An error occurred while retrieving active orders" });
            }
        }

        // Accept Order (Restaurant)
        [HttpPost("{id}/accept")]
        [Authorize(Roles = "Restaurant")]
        public async Task<IActionResult> AcceptOrder(Guid id, [FromBody] AcceptOrderRequest? request = null)
        {
            try
            {
                var userId = GetCurrentUserId();
                var restaurant = await GetUserRestaurantOrNotFound(userId);
                if (restaurant == null)
                    return NotFound(new { message = "Restaurant not found for this user" });

                var order = await _orderService.AcceptOrderAsync(id, restaurant.Id, request?.EstimatedPreparationTime);

                return Ok(new { message = "Order accepted successfully", data = order });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error accepting order {OrderId}", id);
                return StatusCode(500, new { message = "An error occurred while accepting the order" });
            }
        }

        // Reject Order (Restaurant)
        [HttpPost("{id}/reject")]
        [Authorize(Roles = "Restaurant")]
        public async Task<IActionResult> RejectOrder(Guid id, [FromBody] RejectOrderRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var restaurant = await GetUserRestaurantOrNotFound(userId);
                if (restaurant == null)
                    return NotFound(new { message = "Restaurant not found for this user" });

                var order = await _orderService.RejectOrderAsync(id, restaurant.Id, request.Reason);

                return Ok(new { message = "Order rejected", data = order });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rejecting order {OrderId}", id);
                return StatusCode(500, new { message = "An error occurred while rejecting the order" });
            }
        }

        // Mark as Preparing (Restaurant)
        [HttpPost("{id}/preparing")]
        [Authorize(Roles = "Restaurant")]
        public async Task<IActionResult> MarkAsPreparing(Guid id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var restaurant = await GetUserRestaurantOrNotFound(userId);
                if (restaurant == null)
                    return NotFound(new { message = "Restaurant not found for this user" });

                var order = await _orderService.MarkAsPreparingAsync(id, restaurant.Id);

                return Ok(new { message = "Order marked as preparing", data = order });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating order {OrderId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the order" });
            }
        }

        // Mark as Ready (Restaurant)
        [HttpPost("{id}/ready")]
        [Authorize(Roles = "Restaurant")]
        public async Task<IActionResult> MarkAsReady(Guid id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var restaurant = await GetUserRestaurantOrNotFound(userId);
                if (restaurant == null)
                    return NotFound(new { message = "Restaurant not found for this user" });

                var order = await _orderService.MarkAsReadyAsync(id, restaurant.Id);

                return Ok(new { message = "Order marked as ready", data = order });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating order {OrderId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the order" });
            }
        }

        // Mark as Delivered (Restaurant)
        [HttpPost("{id}/delivered")]
        [Authorize(Roles = "Restaurant")]
        public async Task<IActionResult> MarkAsDelivered(Guid id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var restaurant = await GetUserRestaurantOrNotFound(userId);
                if (restaurant == null)
                    return NotFound(new { message = "Restaurant not found for this user" });

                var order = await _orderService.MarkAsDeliveredAsync(id, restaurant.Id);

                return Ok(new { message = "Order marked as delivered", data = order });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating order {OrderId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the order" });
            }
        }

        // Cancel Order (Customer or Restaurant)
        [HttpPost("{id}/cancel")]
        [Authorize]
        public async Task<IActionResult> CancelOrder(Guid id, [FromBody] CancelOrderRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var order = await _orderService.CancelOrderAsync(id, userId, request);

                return Ok(new { message = "Order cancelled successfully", data = order });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling order {OrderId}", id);
                return StatusCode(500, new { message = "An error occurred while cancelling the order" });
            }
        }

        // Add Review (Customer)
        [HttpPost("{id}/review")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> AddReview(Guid id, [FromBody] AddOrderReviewRequest request)
        {
            try
            {
                var customerId = GetCurrentUserId();
                var order = await _orderService.AddReviewAsync(id, customerId, request);

                return Ok(new { message = "Review added successfully", data = order });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding review to order {OrderId}", id);
                return StatusCode(500, new { message = "An error occurred while adding the review" });
            }
        }

        // Dummy Payment - Marks order as paid instantly (Customer only)
        [HttpPost("{id}/pay")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> PayOrder(Guid id)
        {
            try
            {
                var customerId = GetCurrentUserId();

                // Generate a dummy payment reference so the customer doesn't need to supply one
                var dummyReference = $"DUMMY-PAY-{Guid.NewGuid().ToString("N")[..10].ToUpper()}";

                var order = await _orderService.ConfirmPaymentAsync(id, dummyReference);

                return Ok(new
                {
                    message = "Payment successful",
                    paymentReference = dummyReference,
                    data = order
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing payment for order {OrderId}", id);
                return StatusCode(500, new { message = "An error occurred while processing payment" });
            }
        }

        // Confirm Payment via webhook/internal (no auth — add webhook secret validation in production)
        [HttpPost("{id}/confirm-payment")]
        [AllowAnonymous]
        public async Task<IActionResult> ConfirmPayment(Guid id, [FromBody] ConfirmPaymentRequest request)
        {
            try
            {
                // TODO: Verify webhook signature from payment provider before trusting this endpoint
                var order = await _orderService.ConfirmPaymentAsync(id, request.PaymentReference);

                return Ok(new { message = "Payment confirmed", data = order });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error confirming payment for order {OrderId}", id);
                return StatusCode(500, new { message = "An error occurred while confirming payment" });
            }
        }

        // Helper methods
        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                throw new UnauthorizedAccessException("User ID not found in token");

            return userId;
        }

        private async Task<FoodOrdering.Core.Entities.Restaurant?> GetUserRestaurantOrNotFound(Guid userId)
        {
            return await _restaurantService.GetRestaurantByUserIdAsync(userId);
        }
    }

    // Request DTOs
    public class AcceptOrderRequest
    {
        public DateTime? EstimatedPreparationTime { get; set; }
    }

    public class RejectOrderRequest
    {
        [Required]
        public string Reason { get; set; } = string.Empty;
    }

    public class ConfirmPaymentRequest
    {
        [Required]
        public string PaymentReference { get; set; } = string.Empty;
    }
}