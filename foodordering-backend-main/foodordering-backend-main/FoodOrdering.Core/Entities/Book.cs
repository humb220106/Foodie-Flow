using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Core.Entities
{
    public class Book
    {
        public Guid Id { get; set; }
        public Guid RestaurantId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? Excerpt { get; set; }
        public string? CoverImage { get; set; }
        public string? Tags { get; set; }
        public bool IsPublished { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public int ViewCount { get; set; } = 0;
        public DateTime? PublishedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Navigation
        public Restaurant Restaurant { get; set; } = null!;
    }
}
