// FoodOrdering.API.Controllers/BookController.cs
using FoodOrdering.Application.DTOs.Book;
using FoodOrdering.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace FoodOrdering.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BookController : ControllerBase
    {
        private readonly IBookService _bookService;
        private readonly IRestaurantService _restaurantService;
        private readonly ILogger<BookController> _logger;

        public BookController(
            IBookService bookService,
            IRestaurantService restaurantService,
            ILogger<BookController> logger)
        {
            _bookService = bookService;
            _restaurantService = restaurantService;
            _logger = logger;
        }

        // Create Book (Restaurant only)
        [HttpPost]
        [Authorize(Policy ="RestaurantOnly")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> CreateBook([FromForm] CreateBookRequest request)
        {
            try
            {
                var restaurant = await GetUserRestaurant();
                if (restaurant == null)
                    return NotFound(new { message = "Restaurant not found for this user" });

                var book = await _bookService.CreateBookAsync(restaurant.Id, request);
                return CreatedAtAction(nameof(GetBookById), new { id = book.Id },
                    new { message = "Book created successfully", data = book });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating book");
                return StatusCode(500, new { message = "An error occurred while creating the book" });
            }
        }

        // Get Book by ID (Public)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetBookById(Guid id)
        {
            try
            {
                var book = await _bookService.GetBookByIdAsync(id);
                await _bookService.IncrementBookViewAsync(id);
                return Ok(new { data = book });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving book {BookId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the book" });
            }
        }

        // Get Book by Slug (Public)
        [HttpGet("slug/{slug}")]
        public async Task<IActionResult> GetBookBySlug(string slug)
        {
            try
            {
                var book = await _bookService.GetBookBySlugAsync(slug);
                await _bookService.IncrementBookViewAsync(book.Id);
                return Ok(new { data = book });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving book by slug {Slug}", slug);
                return StatusCode(500, new { message = "An error occurred while retrieving the book" });
            }
        }

        // Get My Restaurant Books (Restaurant - sees all including drafts)
        [HttpGet("my-books")]
        [Authorize(Policy = "RestaurantOnly")]
        public async Task<IActionResult> GetMyBooks(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var restaurant = await GetUserRestaurant();
                if (restaurant == null)
                    return NotFound(new { message = "Restaurant not found for this user" });

                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 20;

                var books = await _bookService.GetRestaurantBooksAsync(restaurant.Id, page, pageSize, publishedOnly: false);
                return Ok(new { data = books, page, pageSize, count = books.Count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving restaurant books");
                return StatusCode(500, new { message = "An error occurred while retrieving books" });
            }
        }

        // Get Restaurant Books - Public (published only)
        [HttpGet("restaurant/{restaurantId}")]
        public async Task<IActionResult> GetRestaurantBooks(
            Guid restaurantId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 20;

                var books = await _bookService.GetRestaurantBooksAsync(restaurantId, page, pageSize, publishedOnly: true);
                return Ok(new { data = books, page, pageSize, count = books.Count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving books for restaurant {RestaurantId}", restaurantId);
                return StatusCode(500, new { message = "An error occurred while retrieving books" });
            }
        }

        // Search Books (Public)
        [HttpGet("search")]
        public async Task<IActionResult> SearchBooks(
            [FromQuery] string q,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(q))
                    return BadRequest(new { message = "Search term is required" });

                var books = await _bookService.SearchBooksAsync(q, page, pageSize);
                return Ok(new { data = books, page, pageSize, count = books.Count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching books");
                return StatusCode(500, new { message = "An error occurred while searching books" });
            }
        }

        // Update Book (Restaurant only)
        [HttpPut("{id}")]
        [Authorize(Policy = "RestaurantOnly")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateBook(Guid id, [FromForm] UpdateBookRequest request)
        {
            try
            {
                var restaurant = await GetUserRestaurant();
                if (restaurant == null)
                    return NotFound(new { message = "Restaurant not found for this user" });

                var book = await _bookService.UpdateBookAsync(id, restaurant.Id, request);
                return Ok(new { message = "Book updated successfully", data = book });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating book {BookId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the book" });
            }
        }

        // Delete Book (Restaurant only)
        [HttpDelete("{id}")]
        [Authorize(Policy = "RestaurantOnly")]
        public async Task<IActionResult> DeleteBook(Guid id)
        {
            try
            {
                var restaurant = await GetUserRestaurant();
                if (restaurant == null)
                    return NotFound(new { message = "Restaurant not found for this user" });

                await _bookService.DeleteBookAsync(id, restaurant.Id);
                return Ok(new { message = "Book deleted successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting book {BookId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the book" });
            }
        }

        // Helpers
        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                throw new UnauthorizedAccessException("User ID not found in token");
            return userId;
        }

        private async Task<FoodOrdering.Core.Entities.Restaurant?> GetUserRestaurant()
        {
            var userId = GetCurrentUserId();
            return await _restaurantService.GetRestaurantByUserIdAsync(userId);
        }
    }
}