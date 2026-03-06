// FoodOrdering.Core.Entities/Menu.cs
using System;
using System.Collections.Generic;

namespace FoodOrdering.Core.Entities
{
    public class Menu
    {
        public Guid Id { get; set; }
        public Guid RestaurantId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsDefault { get; set; } = false;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Navigation
        public Restaurant Restaurant { get; set; } = null!;
        public ICollection<MenuSection> Sections { get; set; } = new List<MenuSection>();
    }

    public class MenuSection
    {
        public Guid Id { get; set; }
        public Guid MenuId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int DisplayOrder { get; set; } = 0;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Navigation
        public Menu Menu { get; set; } = null!;
        public ICollection<MenuSectionDish> MenuSectionDishes { get; set; } = new List<MenuSectionDish>();
    }

    public class MenuSectionDish
    {
        public Guid Id { get; set; }
        public Guid MenuSectionId { get; set; }
        public Guid DishId { get; set; }
        public int DisplayOrder { get; set; } = 0;

        // Navigation
        public MenuSection MenuSection { get; set; } = null!;
        public Dish Dish { get; set; } = null!;
    }
}