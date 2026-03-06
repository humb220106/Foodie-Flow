// FoodOrdering.Application.DTOs.Menu/MenuDtos.cs
using System;
using System.Collections.Generic;

namespace FoodOrdering.Application.DTOs.Menu
{
    public class CreateMenuRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsDefault { get; set; } = false;
        public List<CreateMenuSectionRequest> Sections { get; set; } = new();
    }

    public class CreateMenuSectionRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int DisplayOrder { get; set; } = 0;
        public List<MenuSectionDishRequest> Dishes { get; set; } = new();
    }

    public class MenuSectionDishRequest
    {
        public Guid DishId { get; set; }
        public int DisplayOrder { get; set; } = 0;
    }

    public class UpdateMenuRequest
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public bool? IsDefault { get; set; }
        public bool? IsActive { get; set; }
    }

    public class UpdateMenuSectionRequest
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public int? DisplayOrder { get; set; }
    }

    public class MenuResponse
    {
        public Guid Id { get; set; }
        public Guid RestaurantId { get; set; }
        public string RestaurantName { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsDefault { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<MenuSectionResponse> Sections { get; set; } = new();
    }

    public class MenuSectionResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int DisplayOrder { get; set; }
        public List<MenuSectionDishResponse> Dishes { get; set; } = new();
    }

    public class MenuSectionDishResponse
    {
        public Guid DishId { get; set; }
        public string DishName { get; set; } = string.Empty;
        public string? DishImage { get; set; }
        public decimal Price { get; set; }
        public bool IsAvailable { get; set; }
        public int DisplayOrder { get; set; }
    }

    public class MenuSummaryResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsDefault { get; set; }
        public bool IsActive { get; set; }
        public int SectionCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}