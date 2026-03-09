// FoodOrdering.Application.DTOs.Book/BookDtos.cs
using Microsoft.AspNetCore.Http;
using System;

namespace FoodOrdering.Application.DTOs.Book
{
    public class CreateBookRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? Excerpt { get; set; }
        public IFormFile? CoverImage { get; set; }
        public string? Tags { get; set; }
        public bool IsPublished { get; set; } = false;
    }

    public class UpdateBookRequest
    {
        public string? Title { get; set; }
        public string? Content { get; set; }
        public string? Excerpt { get; set; }
        public IFormFile? CoverImage { get; set; }
        public string? Tags { get; set; }
        public bool? IsPublished { get; set; }
    }

    public class BookResponse
    {
        public Guid Id { get; set; }
        public Guid RestaurantId { get; set; }
        public string RestaurantName { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? Excerpt { get; set; }
        public string? CoverImage { get; set; }
        public string? Tags { get; set; }
        public bool IsPublished { get; set; }
        public int ViewCount { get; set; }
        public DateTime? PublishedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class BookSummaryResponse
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? Excerpt { get; set; }
        public string? CoverImage { get; set; }
        public string? Tags { get; set; }
        public bool IsPublished { get; set; }
        public int ViewCount { get; set; }
        public DateTime? PublishedAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}