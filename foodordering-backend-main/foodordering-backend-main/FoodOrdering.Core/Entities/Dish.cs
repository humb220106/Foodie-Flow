using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Numerics;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Core.Entities
{
    public class Dish
    {
        public Guid Id { get; set; }
        public Guid RestaurantId { get; set; }
        public Restaurant Restaurant { get; set; } = null!;
 
       
       

        // Basic Information
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? ShortDescription { get; set; }

        // Pricing
        public decimal Price { get; set; }
        public decimal? CompareAtPrice { get; set; } // Original price for discount display


       

        // Category & Classification
        public Guid CategoryId { get; set; }
        public Category Category { get; set; } = null!;
        public string? Tags { get; set; } // Comma-separated

        // Media
        public string? PrimaryImage { get; set; }
        public string? Images { get; set; } // JSON array of image URLs
        public string? VideoUrl { get; set; }

       



        // Status
        public string Status { get; set; } = "Draft"; // Draft, Active, OutOfStock, Archived
        public bool IsActive { get; set; } = true;
        public bool IsFeatured { get; set; } = false;
       

        // SEO
        public string? MetaTitle { get; set; }
        public string? MetaDescription { get; set; }
        public string? MetaKeywords { get; set; }

        // Statistics
        public int ViewCount { get; set; } = 0;
        public int FavoriteCount { get; set; } = 0;
        public int SoldCount { get; set; } = 0;
        public decimal AverageRating { get; set; } = 0;
        public int ReviewCount { get; set; } = 0;
        public bool IsAvailable { get; set; } = true;
        public int StockQuantity { get; set; }
        public int PreparationTimeMinutes { get; set; }




        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? PublishedAt { get; set; }

        public ICollection<Review> Reviews { get; set; } = new List<Review>();
    }
}

