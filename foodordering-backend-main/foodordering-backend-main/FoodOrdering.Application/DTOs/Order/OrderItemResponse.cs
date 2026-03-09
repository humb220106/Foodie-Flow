using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.DTOs.Order
{
    public class OrderItemResponse
    {
        public Guid Id { get; set; }
        public Guid DishId { get; set; }
        public string DishName { get; set; } = string.Empty;
        public string? DishImage { get; set; }
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
        public decimal SubTotal { get; set; }
        public string? SpecialInstructions { get; set; }
        public string? Customizations { get; set; }
    }
}
