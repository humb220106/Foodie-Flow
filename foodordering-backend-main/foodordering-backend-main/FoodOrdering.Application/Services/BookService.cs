// FoodOrdering.Application.Services/BookService.cs
using FoodOrdering.Application.DTOs.Book;
using FoodOrdering.Application.Interfaces;
using FoodOrdering.Application.Repositories;
using FoodOrdering.Core.Entities;
using FoodOrdering.Core.Enums;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace FoodOrdering.Application.Services
{
    public class BookService : IBookService
    {
        private readonly IBookRepository _bookRepository;
        private readonly IRestaurantRepository _restaurantRepository;
        private readonly IAuditLogRepository _auditLogRepository;
        private readonly IFileStorageService _fileStorageService;
        private readonly ILogger<BookService> _logger;

        public BookService(
            IBookRepository bookRepository,
            IRestaurantRepository restaurantRepository,
            IAuditLogRepository auditLogRepository,
            IFileStorageService fileStorageService,
            ILogger<BookService> logger)
        {
            _bookRepository = bookRepository;
            _restaurantRepository = restaurantRepository;
            _auditLogRepository = auditLogRepository;
            _fileStorageService = fileStorageService;
            _logger = logger;
        }

        public async Task<BookResponse> CreateBookAsync(Guid restaurantId, CreateBookRequest request)
        {
            var restaurant = await _restaurantRepository.GetByIdAsync(restaurantId);
            if (restaurant == null)
                throw new InvalidOperationException("Restaurant not found.");

            string? coverImageUrl = null;
            if (request.CoverImage != null)
                coverImageUrl = await _fileStorageService.UploadImageAsync(request.CoverImage, "books/covers");

            var slug = GenerateSlug(request.Title);
            var uniqueSlug = await EnsureUniqueSlugAsync(slug);

            var book = new Book
            {
                Id = Guid.NewGuid(),
                RestaurantId = restaurantId,
                Title = request.Title,
                Slug = uniqueSlug,
                Content = request.Content,
                Excerpt = request.Excerpt,
                CoverImage = coverImageUrl,
                Tags = request.Tags,
                IsPublished = request.IsPublished,
                PublishedAt = request.IsPublished ? DateTime.UtcNow : null,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _bookRepository.CreateAsync(book);
            await LogAuditAsync(restaurant.UserId, "Book Created", $"Book: {request.Title}", "System", true);
            _logger.LogInformation("Book {BookTitle} created for restaurant {RestaurantId}", request.Title, restaurantId);

            return MapToBookResponse(created);
        }

        public async Task<BookResponse> GetBookByIdAsync(Guid bookId)
        {
            var book = await _bookRepository.GetByIdAsync(bookId);
            if (book == null || !book.IsActive)
                throw new InvalidOperationException("Book not found.");

            return MapToBookResponse(book);
        }

        public async Task<BookResponse> GetBookBySlugAsync(string slug)
        {
            var book = await _bookRepository.GetBySlugAsync(slug);
            if (book == null || !book.IsActive)
                throw new InvalidOperationException("Book not found.");

            return MapToBookResponse(book);
        }

        public async Task<List<BookSummaryResponse>> GetRestaurantBooksAsync(Guid restaurantId, int page = 1, int pageSize = 20, bool publishedOnly = false)
        {
            var skip = (page - 1) * pageSize;
            var books = await _bookRepository.GetByRestaurantIdAsync(restaurantId, skip, pageSize, publishedOnly);
            return books.Select(MapToBookSummary).ToList();
        }

        public async Task<BookResponse> UpdateBookAsync(Guid bookId, Guid restaurantId, UpdateBookRequest request)
        {
            var book = await _bookRepository.GetByIdAsync(bookId);
            if (book == null || !book.IsActive)
                throw new InvalidOperationException("Book not found.");

            if (book.RestaurantId != restaurantId)
                throw new UnauthorizedAccessException("You don't have permission to update this book.");

            if (!string.IsNullOrWhiteSpace(request.Title) && request.Title != book.Title)
            {
                book.Title = request.Title;
                var newSlug = GenerateSlug(request.Title);
                book.Slug = await EnsureUniqueSlugAsync(newSlug, book.Id);
            }

            if (!string.IsNullOrWhiteSpace(request.Content))
                book.Content = request.Content;

            if (request.Excerpt != null)
                book.Excerpt = request.Excerpt;

            if (request.Tags != null)
                book.Tags = request.Tags;

            if (request.CoverImage != null)
            {
                if (!string.IsNullOrEmpty(book.CoverImage))
                    await _fileStorageService.DeleteImageAsync(book.CoverImage);

                book.CoverImage = await _fileStorageService.UploadImageAsync(request.CoverImage, "books/covers");
            }

            if (request.IsPublished.HasValue)
            {
                // Set PublishedAt only on first publish
                if (request.IsPublished.Value && !book.IsPublished)
                    book.PublishedAt = DateTime.UtcNow;

                book.IsPublished = request.IsPublished.Value;
            }

            book.UpdatedAt = DateTime.UtcNow;
            await _bookRepository.UpdateAsync(book);

            var restaurant = await _restaurantRepository.GetByIdAsync(restaurantId);
            await LogAuditAsync(restaurant!.UserId, "Book Updated", $"Book: {book.Title} (ID: {bookId})", "System", true);
            _logger.LogInformation("Book {BookId} updated for restaurant {RestaurantId}", bookId, restaurantId);

            return MapToBookResponse(book);
        }

        public async Task DeleteBookAsync(Guid bookId, Guid restaurantId)
        {
            var book = await _bookRepository.GetByIdAsync(bookId);
            if (book == null || !book.IsActive)
                throw new InvalidOperationException("Book not found.");

            if (book.RestaurantId != restaurantId)
                throw new UnauthorizedAccessException("You don't have permission to delete this book.");

            if (!string.IsNullOrEmpty(book.CoverImage))
                await _fileStorageService.DeleteImageAsync(book.CoverImage);

            // Soft delete
            book.IsActive = false;
            book.UpdatedAt = DateTime.UtcNow;
            await _bookRepository.UpdateAsync(book);

            var restaurant = await _restaurantRepository.GetByIdAsync(restaurantId);
            await LogAuditAsync(restaurant!.UserId, "Book Deleted", $"Book: {book.Title} (ID: {bookId})", "System", true);
            _logger.LogInformation("Book {BookId} deleted from restaurant {RestaurantId}", bookId, restaurantId);
        }

        public async Task<List<BookSummaryResponse>> SearchBooksAsync(string searchTerm, int page = 1, int pageSize = 20)
        {
            var skip = (page - 1) * pageSize;
            var books = await _bookRepository.SearchAsync(searchTerm, skip, pageSize);
            return books.Select(MapToBookSummary).ToList();
        }

        public async Task IncrementBookViewAsync(Guid bookId)
        {
            try
            {
                await _bookRepository.IncrementViewCountAsync(bookId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error incrementing view count for book {BookId}", bookId);
                // Non-critical — don't throw
            }
        }

        // ── Helpers ──────────────────────────────────────────────────

        private string GenerateSlug(string title)
        {
            var slug = title.ToLowerInvariant();
            slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
            slug = Regex.Replace(slug, @"\s+", "-");
            slug = Regex.Replace(slug, @"-+", "-");
            return slug.Trim('-');
        }

        private async Task<string> EnsureUniqueSlugAsync(string slug, Guid? excludeId = null)
        {
            var uniqueSlug = slug;
            var counter = 1;

            while (!await _bookRepository.IsSlugUniqueAsync(uniqueSlug, excludeId))
            {
                uniqueSlug = $"{slug}-{counter}";
                counter++;
            }

            return uniqueSlug;
        }

        private BookResponse MapToBookResponse(Book book) => new()
        {
            Id = book.Id,
            RestaurantId = book.RestaurantId,
            RestaurantName = book.Restaurant?.RestaurantName ?? "Unknown",
            Title = book.Title,
            Slug = book.Slug,
            Content = book.Content,
            Excerpt = book.Excerpt,
            CoverImage = book.CoverImage,
            Tags = book.Tags,
            IsPublished = book.IsPublished,
            ViewCount = book.ViewCount,
            PublishedAt = book.PublishedAt,
            CreatedAt = book.CreatedAt,
            UpdatedAt = book.UpdatedAt
        };

        private BookSummaryResponse MapToBookSummary(Book book) => new()
        {
            Id = book.Id,
            Title = book.Title,
            Slug = book.Slug,
            Excerpt = book.Excerpt,
            CoverImage = book.CoverImage,
            Tags = book.Tags,
            IsPublished = book.IsPublished,
            ViewCount = book.ViewCount,
            PublishedAt = book.PublishedAt,
            CreatedAt = book.CreatedAt
        };

        private async Task LogAuditAsync(Guid userId, string action, string details, string ipAddress, bool isSuccess)
        {
            await _auditLogRepository.CreateAsync(new Core.Entities.AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Action = action,
                Details = details,
                IpAddress = ipAddress,
                CreatedAt = DateTime.UtcNow,
                IsSuccess = isSuccess
            });
        }
    }
}