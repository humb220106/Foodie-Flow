using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.DTOs.Dish
{
    public record DishResponse(
    Guid Id,
    Guid RestaurantId,
    string RestaurantName,
    string Title,
    string Slug,
    string Description,
    string? ShortDescription,
    decimal Price,
    bool IsAvailable,
    Guid CategoryId,
    string CategoryName,
    string? Tags,
    string? PrimaryImage,
    List<string>? Images,
    string? VideoUrl,
    string Status,
    bool IsActive,
    bool IsFeatured,
    int ViewCount,
    int FavoriteCount,
    decimal AverageRating,
    int ReviewCount,
    DateTime CreatedAt
   
);
}
