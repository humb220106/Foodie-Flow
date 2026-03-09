using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.DTOs.Order
{
    public class OrderItemRequest
    {
        [Required]
        public Guid DishId { get; set; }

        [Required]
        [Range(1, 100, ErrorMessage = "Quantity must be between 1 and 100")]
        public int Quantity { get; set; }

        public string? SpecialInstructions { get; set; }

        // For future customizations (e.g., extra cheese, no onions)
        public string? Customizations { get; set; }
    }
}
