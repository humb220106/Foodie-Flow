using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Core.Entities
{
   public class OrderItem
    {
        public Guid Id { get; set; }

        // Order Reference
        public Guid OrderId { get; set; }
        public Order Order { get; set; } = null!;

        // Dish Information
        public Guid DishId { get; set; }
        public Dish Dish { get; set; } = null!;

        // Item Details (snapshot at time of order)
        public string DishName { get; set; } = string.Empty;
        public string? DishImage { get; set; }
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }

        // Customizations and Special Requests
        public string? SpecialInstructions { get; set; }
        public string? Customizations { get; set; } // JSON string for add-ons, modifications, etc.

        // Calculated totals
        public decimal SubTotal { get; set; } // UnitPrice * Quantity

        // Metadata
        public DateTime CreatedAt { get; set; }
    }
}
