using FoodOrdering.Application.DTOs.Book;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Application.Interfaces
{
    public interface IBookService
    {
        Task<BookResponse> CreateBookAsync(Guid restaurantId, CreateBookRequest request);
        Task<BookResponse> GetBookByIdAsync(Guid bookId);
        Task<BookResponse> GetBookBySlugAsync(string slug);
        Task<List<BookSummaryResponse>> GetRestaurantBooksAsync(Guid restaurantId, int page = 1, int pageSize = 20, bool publishedOnly = false);
        Task<BookResponse> UpdateBookAsync(Guid bookId, Guid restaurantId, UpdateBookRequest request);
        Task DeleteBookAsync(Guid bookId, Guid restaurantId);
        Task<List<BookSummaryResponse>> SearchBooksAsync(string searchTerm, int page = 1, int pageSize = 20);
        Task IncrementBookViewAsync(Guid bookId);
    }
}
