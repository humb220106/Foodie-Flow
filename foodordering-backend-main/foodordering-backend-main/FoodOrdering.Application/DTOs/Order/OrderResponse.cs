using FoodOrdering.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.DTOs.Order
{
    public class OrderResponse
    {
        public Guid Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;

        // Customer Information
        public Guid CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerPhone { get; set; } = string.Empty;

        // Restaurant Information
        public Guid RestaurantId { get; set; }
        public string RestaurantName { get; set; } = string.Empty;
        public string? RestaurantLogo { get; set; }

        // Order Items
        public List<OrderItemResponse> Items { get; set; } = new();

        // Pricing
        public decimal SubTotal { get; set; }
        public decimal DeliveryFee { get; set; }
        public decimal ServiceFee { get; set; }
        public decimal Tax { get; set; }
        public decimal Discount { get; set; }
        public decimal TotalAmount { get; set; }

        // Delivery Information
      
        public string DeliveryAddress { get; set; } = string.Empty;
        public string DeliveryCity { get; set; } = string.Empty;
        public string DeliveryState { get; set; } = string.Empty;
        public string? DeliveryInstructions { get; set; }

        // Status
        public OrderStatus Status { get; set; }
       
        public string? PaymentMethod { get; set; }

        // Timestamps
        public DateTime CreatedAt { get; set; }
        public DateTime? AcceptedAt { get; set; }
        public DateTime? PreparingAt { get; set; }
        public DateTime? ReadyAt { get; set; }
        public DateTime? DeliveredAt { get; set; }
        public DateTime? EstimatedDeliveryTime { get; set; }

        // Notes
        public string? CustomerNotes { get; set; }
        public string? RestaurantNotes { get; set; }

        // Review
        public int? Rating { get; set; }
        public string? Review { get; set; }
    }
}
