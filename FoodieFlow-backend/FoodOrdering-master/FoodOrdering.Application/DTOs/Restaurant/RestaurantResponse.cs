using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.DTOs.Restaurant
{
    public record RestaurantResponse(
    Guid Id,
    Guid UserId,
    string RestaurantName,
    string RestaurantSlug,
    string? RestaurantDescription,
    string? RestaurantLogo,
    string? RestaurantBanner,
    int TotalSales,
    decimal AverageRating,
    int TotalReviews,
    DateTime CreatedAt
);
}
