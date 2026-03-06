using FoodOrdering.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Core.Entities
{
  
        public class Order
        {
            public Guid Id { get; set; }
            public string OrderNumber { get; set; } = string.Empty;

            // Customer Information
            public Guid CustomerId { get; set; }
            public User Customer { get; set; } = null!;

            // Restaurant Information
            public Guid RestaurantId { get; set; }
            public Restaurant Restaurant { get; set; } = null!;

            // Order Items
            public List<OrderItem> OrderItems { get; set; } = new();

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
            public string DeliveryPostalCode { get; set; } = string.Empty;
            public string? DeliveryInstructions { get; set; }
            public string CustomerPhone { get; set; } = string.Empty;

            // Coordinates for delivery tracking
            public decimal? DeliveryLatitude { get; set; }
            public decimal? DeliveryLongitude { get; set; }

            // Order Status and Tracking
            public OrderStatus Status { get; set; }
             public bool IsPaid { get; set; }
        // Payment Information
        public string? PaymentMethod { get; set; }
            public string? PaymentReference { get; set; }
            public DateTime? PaidAt { get; set; }

            // Timestamps
            public DateTime? AcceptedAt { get; set; }
            public DateTime? PreparingAt { get; set; }
            public DateTime? ReadyAt { get; set; }
            public DateTime? PickedUpAt { get; set; }
            public DateTime? DeliveredAt { get; set; }
            public DateTime? CancelledAt { get; set; }

            // Estimated times
            public DateTime? EstimatedPreparationTime { get; set; }
            public DateTime? EstimatedDeliveryTime { get; set; }

            // Notes and Special Requests
            public string? CustomerNotes { get; set; }
            public string? RestaurantNotes { get; set; }
            public string? CancellationReason { get; set; }

            // Rating and Review
            public int? Rating { get; set; }
            public string? Review { get; set; }
            public DateTime? ReviewedAt { get; set; }

            // Metadata
            public bool IsActive { get; set; }
            public DateTime CreatedAt { get; set; }
            public DateTime? UpdatedAt { get; set; }
        }
    }

