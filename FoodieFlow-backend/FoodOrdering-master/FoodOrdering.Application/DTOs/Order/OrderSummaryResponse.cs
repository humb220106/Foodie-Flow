using FoodOrdering.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.DTOs.Order
{
    public class OrderSummaryResponse
    {
        public Guid Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public Guid RestaurantId { get; set; }
        public string RestaurantName { get; set; } = string.Empty;
        public string? RestaurantLogo { get; set; }
        public int ItemCount { get; set; }
        public decimal TotalAmount { get; set; }
        public OrderStatus Status { get; set; }
        
        public DateTime CreatedAt { get; set; }
        public DateTime? EstimatedDeliveryTime { get; set; }
    }

}
