using FoodOrdering.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.DTOs.Order
{
    public record CreateOrderResponse(
       Guid OrderId,
       string OrderNumber,
       decimal TotalAmount,
       OrderStatus Status,
       DateTime CreatedAt,
       DateTime? EstimatedDeliveryTime
   );
}
