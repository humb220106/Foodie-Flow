using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.DTOs.Category
{
    public record CategoryResponse(
    Guid Id,
    string Name,
    string Slug,
    string? Description,
    string? Icon,
    Guid? ParentCategoryId,
    int ProductCount,
    DateTime CreatedAt
);
}
