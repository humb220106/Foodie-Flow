using FoodOrdering.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.Repositories
{
    public interface IBookRepository
    {
        Task<Book> CreateAsync(Book book);
        Task<Book?> GetByIdAsync(Guid id);
        Task<Book?> GetBySlugAsync(string slug);
        Task<List<Book>> GetByRestaurantIdAsync(Guid restaurantId, int skip, int pageSize, bool publishedOnly = false);
        Task<List<Book>> SearchAsync(string searchTerm, int skip, int pageSize);
        Task UpdateAsync(Book book);
        Task<bool> IsSlugUniqueAsync(string slug, Guid? excludeId = null);
        Task IncrementViewCountAsync(Guid bookId);
    }
}
