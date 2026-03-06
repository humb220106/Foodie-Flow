// FoodOrdering.Infrastructure.Repositories/BookRepository.cs
using FoodOrdering.Application.Repositories;
using FoodOrdering.Core.Entities;
using FoodOrdering.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FoodOrdering.Infrastructure.Repositories
{
    public class BookRepository : IBookRepository
    {
        private readonly AppDbContext _context;
        private readonly ILogger<BookRepository> _logger;

        public BookRepository(AppDbContext context, ILogger<BookRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<Book> CreateAsync(Book book)
        {
            try
            {
                await _context.Books.AddAsync(book);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Book {BookId} created", book.Id);
                return book;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating book {BookTitle}", book.Title);
                throw;
            }
        }

        public async Task<Book?> GetByIdAsync(Guid id)
        {
            try
            {
                return await _context.Books
                    .Include(b => b.Restaurant)
                    .FirstOrDefaultAsync(b => b.Id == id && b.IsActive);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving book {BookId}", id);
                throw;
            }
        }

        public async Task<Book?> GetBySlugAsync(string slug)
        {
            try
            {
                return await _context.Books
                    .Include(b => b.Restaurant)
                    .FirstOrDefaultAsync(b => b.Slug == slug && b.IsActive);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving book by slug {Slug}", slug);
                throw;
            }
        }

        public async Task<List<Book>> GetByRestaurantIdAsync(
            Guid restaurantId,
            int skip,
            int pageSize,
            bool publishedOnly = false)
        {
            try
            {
                var query = _context.Books
                    .Include(b => b.Restaurant)
                    .Where(b => b.RestaurantId == restaurantId && b.IsActive);

                if (publishedOnly)
                    query = query.Where(b => b.IsPublished);

                return await query
                    .OrderByDescending(b => b.CreatedAt)
                    .Skip(skip)
                    .Take(pageSize)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving books for restaurant {RestaurantId}", restaurantId);
                throw;
            }
        }

        public async Task<List<Book>> SearchAsync(string searchTerm, int skip, int pageSize)
        {
            try
            {
                var term = searchTerm.ToLower();

                return await _context.Books
                    .Include(b => b.Restaurant)
                    .Where(b =>
                        b.IsActive &&
                        b.IsPublished &&
                        (b.Title.ToLower().Contains(term) ||
                         b.Content.ToLower().Contains(term) ||
                         (b.Excerpt != null && b.Excerpt.ToLower().Contains(term)) ||
                         (b.Tags != null && b.Tags.ToLower().Contains(term))))
                    .OrderByDescending(b => b.PublishedAt)
                    .Skip(skip)
                    .Take(pageSize)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching books with term {SearchTerm}", searchTerm);
                throw;
            }
        }

        public async Task UpdateAsync(Book book)
        {
            try
            {
                _context.Books.Update(book);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Book {BookId} updated", book.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating book {BookId}", book.Id);
                throw;
            }
        }

        public async Task<bool> IsSlugUniqueAsync(string slug, Guid? excludeId = null)
        {
            try
            {
                var query = _context.Books.Where(b => b.Slug == slug && b.IsActive);

                if (excludeId.HasValue)
                    query = query.Where(b => b.Id != excludeId.Value);

                return !await query.AnyAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking slug uniqueness {Slug}", slug);
                throw;
            }
        }

        public async Task IncrementViewCountAsync(Guid bookId)
        {
            try
            {
                await _context.Books
                    .Where(b => b.Id == bookId)
                    .ExecuteUpdateAsync(s => s.SetProperty(b => b.ViewCount, b => b.ViewCount + 1));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error incrementing view count for book {BookId}", bookId);
                throw;
            }
        }
    }
}