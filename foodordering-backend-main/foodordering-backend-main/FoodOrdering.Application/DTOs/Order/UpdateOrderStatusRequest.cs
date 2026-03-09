using FoodOrdering.Core.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.DTOs.Order
{
    public class UpdateOrderStatusRequest
    {
        [Required]
        public OrderStatus Status { get; set; }

        public string? Notes { get; set; }

        // For estimated times
        public DateTime? EstimatedPreparationTime { get; set; }
        public DateTime? EstimatedDeliveryTime { get; set; }
    }
}
