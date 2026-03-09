using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.DTOs.Dish
{
    public record DishListResponse(
    List<DishResponse> Dishes,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages);
}
