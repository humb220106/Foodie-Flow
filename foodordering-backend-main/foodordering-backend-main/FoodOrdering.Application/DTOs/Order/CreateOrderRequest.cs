using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.DTOs.Order
{
   public class CreateOrderRequest
    {
        [Required]
        public Guid RestaurantId { get; set; }

        [Required]
        [MinLength(1, ErrorMessage = "Order must contain at least one item")]
        public List<OrderItemRequest> Items { get; set; } = new();


        // Delivery Information (required for delivery orders)
        public string? DeliveryAddress { get; set; }
        public string? DeliveryCity { get; set; }
        public string? DeliveryState { get; set; }
        public string? DeliveryPostalCode { get; set; }
        public string? DeliveryInstructions { get; set; }

        [Required]
        [Phone]
        public string CustomerPhone { get; set; } = string.Empty;

        // Optional coordinates for delivery
        public decimal? DeliveryLatitude { get; set; }
        public decimal? DeliveryLongitude { get; set; }

        // Payment
       

        // Customer notes
        public string? CustomerNotes { get; set; }

        // Coupon/Discount code
        public string? CouponCode { get; set; }
    }
}
