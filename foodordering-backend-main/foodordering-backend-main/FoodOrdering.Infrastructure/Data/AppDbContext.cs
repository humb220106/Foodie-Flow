using System;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FoodOrdering.Core.Enums;
using FoodOrdering.Core.Entities;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace FoodOrdering.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<UserRole> UserRoles { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<UserSession> UserSessions { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<Restaurant> Restaurants { get; set; }
        public DbSet<Dish> Dishes { get; set; }
        public DbSet<Category> Categories { get; set; }
       
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Book> Books { get; set; }
        public DbSet<Menu> Menus { get; set; }
        public DbSet<MenuSection> MenuSections { get; set; }
        public DbSet<MenuSectionDish> MenuSectionDishes { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // UserRole many-to-many configuration
            modelBuilder.Entity<UserRole>(entity =>
            {
                entity.HasKey(ur => new { ur.UserId, ur.RoleId });

                entity.HasOne(ur => ur.User)
                    .WithMany(u => u.UserRoles)
                    .HasForeignKey(ur => ur.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(ur => ur.Role)
                    .WithMany(r => r.UserRoles)
                    .HasForeignKey(ur => ur.RoleId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Restaurant configuration
            modelBuilder.Entity<Restaurant>(entity =>
            {
                entity.HasKey(r => r.Id);

                // One User can have One Restaurant (one-to-one relationship)
                entity.HasOne(r => r.User)
                    .WithMany() // User doesn't have a navigation property for restaurants
                    .HasForeignKey(r => r.UserId)
                    .OnDelete(DeleteBehavior.Restrict); // Prevent cascade delete - keep user if restaurant is deleted

                // Configure indexes
                entity.HasIndex(r => r.UserId)
                    .IsUnique(); // Enforce one restaurant per user at database level

                entity.HasIndex(r => r.RestaurantSlug)
                    .IsUnique();

                entity.HasIndex(r => r.IsActive);
                entity.HasIndex(r => r.CreatedAt);

                // Configure decimal precision for money/rating fields
                entity.Property(r => r.TotalRevenue)
                    .HasPrecision(18, 2);

                entity.Property(r => r.AverageRating)
                    .HasPrecision(3, 2);
            });

            // Dish configuration
            modelBuilder.Entity<Dish>(entity =>
            {
                entity.HasKey(d => d.Id);

                // One Restaurant can have Many Dishes (one-to-many relationship)
                entity.HasOne(d => d.Restaurant)
                    .WithMany(r => r.Dishes)
                    .HasForeignKey(d => d.RestaurantId)
                    .OnDelete(DeleteBehavior.Cascade); // Delete dishes when restaurant is deleted

                // One Category can have Many Dishes (one-to-many relationship)
                entity.HasOne(d => d.Category)
                    .WithMany() // Category doesn't have a navigation property for dishes
                    .HasForeignKey(d => d.CategoryId)
                    .OnDelete(DeleteBehavior.Restrict); // Prevent cascade delete - keep category if dish is deleted

                // Configure indexes for common queries
                entity.HasIndex(d => d.Slug)
                    .IsUnique();

                entity.HasIndex(d => d.RestaurantId);
                entity.HasIndex(d => d.CategoryId);
                entity.HasIndex(d => d.IsActive);
                entity.HasIndex(d => d.IsFeatured);
                entity.HasIndex(d => d.CreatedAt);
                entity.HasIndex(d => d.Status);

                // Composite index for common search patterns
                entity.HasIndex(d => new { d.IsActive, d.Status, d.IsFeatured });

                // Configure decimal precision for money/rating fields
                entity.Property(d => d.Price)
                    .HasPrecision(18, 2);

                entity.Property(d => d.CompareAtPrice)
                    .HasPrecision(18, 2);

                entity.Property(d => d.AverageRating)
                    .HasPrecision(3, 2);
            });

            // Category configuration
            modelBuilder.Entity<Category>(entity =>
            {
                entity.HasKey(c => c.Id);

                // Self-referencing relationship for parent-child categories (hierarchical structure)
                entity.HasOne<Category>()
                    .WithMany()
                    .HasForeignKey(c => c.ParentCategoryId)
                    .OnDelete(DeleteBehavior.Restrict); // Prevent cascade delete

                // Configure indexes
                entity.HasIndex(c => c.Slug)
                    .IsUnique();

                entity.HasIndex(c => c.ParentCategoryId);
                entity.HasIndex(c => c.IsActive);
            });

           

            // Configure Order entity
            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasKey(o => o.Id);

                entity.Property(o => o.OrderNumber)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.HasIndex(o => o.OrderNumber)
                    .IsUnique();

                entity.Property(o => o.SubTotal)
                    .HasColumnType("decimal(18,2)");

                entity.Property(o => o.DeliveryFee)
                    .HasColumnType("decimal(18,2)");

                entity.Property(o => o.ServiceFee)
                    .HasColumnType("decimal(18,2)");

                entity.Property(o => o.Tax)
                    .HasColumnType("decimal(18,2)");

                entity.Property(o => o.Discount)
                    .HasColumnType("decimal(18,2)");

                entity.Property(o => o.TotalAmount)
                    .HasColumnType("decimal(18,2)");

                entity.Property(o => o.DeliveryAddress)
                    .HasMaxLength(500);

                entity.Property(o => o.DeliveryCity)
                    .HasMaxLength(100);

                entity.Property(o => o.DeliveryState)
                    .HasMaxLength(100);

                entity.Property(o => o.DeliveryPostalCode)
                    .HasMaxLength(20);

                entity.Property(o => o.DeliveryInstructions)
                    .HasMaxLength(1000);

                entity.Property(o => o.CustomerPhone)
                    .IsRequired()
                    .HasMaxLength(20);

                entity.Property(o => o.DeliveryLatitude)
                    .HasColumnType("decimal(10,8)");

                entity.Property(o => o.DeliveryLongitude)
                    .HasColumnType("decimal(11,8)");

                entity.Property(o => o.PaymentMethod)
                    .HasMaxLength(50);

                entity.Property(o => o.PaymentReference)
                    .HasMaxLength(200);

                entity.Property(o => o.CustomerNotes)
                    .HasMaxLength(1000);

                entity.Property(o => o.RestaurantNotes)
                    .HasMaxLength(1000);

                entity.Property(o => o.CancellationReason)
                    .HasMaxLength(500);

                entity.Property(o => o.Review)
                    .HasMaxLength(2000);

                // Relationships
                entity.HasOne(o => o.Customer)
                    .WithMany()
                    .HasForeignKey(o => o.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(o => o.Restaurant)
                    .WithMany()
                    .HasForeignKey(o => o.RestaurantId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(o => o.OrderItems)
                    .WithOne(oi => oi.Order)
                    .HasForeignKey(oi => oi.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Indexes for performance
                entity.HasIndex(o => o.CustomerId);
                entity.HasIndex(o => o.RestaurantId);
                entity.HasIndex(o => o.Status);
                entity.HasIndex(o => o.CreatedAt);
                entity.HasIndex(o => new { o.RestaurantId, o.Status });
                entity.HasIndex(o => new { o.CustomerId, o.Status });
            });

            // Configure OrderItem entity
            modelBuilder.Entity<OrderItem>(entity =>
            {
                entity.HasKey(oi => oi.Id);

                entity.Property(oi => oi.DishName)
                    .IsRequired()
                    .HasMaxLength(200);

                entity.Property(oi => oi.DishImage)
                    .HasMaxLength(500);

                entity.Property(oi => oi.UnitPrice)
                    .HasColumnType("decimal(18,2)");

                entity.Property(oi => oi.SubTotal)
                    .HasColumnType("decimal(18,2)");

                entity.Property(oi => oi.SpecialInstructions)
                    .HasMaxLength(500);

                // Relationships
                entity.HasOne(oi => oi.Order)
                    .WithMany(o => o.OrderItems)
                    .HasForeignKey(oi => oi.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(oi => oi.Dish)
                    .WithMany()
                    .HasForeignKey(oi => oi.DishId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Indexes
                entity.HasIndex(oi => oi.OrderId);
                entity.HasIndex(oi => oi.DishId);
            });
            // Configure Review entity
            modelBuilder.Entity<Review>(entity =>
            {
                entity.HasKey(r => r.Id);

                // Author relationship
                entity.HasOne(r => r.Author)
                    .WithMany()
                    .HasForeignKey(r => r.AuthorId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Dish review relationship (nullable)
                entity.HasOne(r => r.Dish)
                    .WithMany()
                    .HasForeignKey(r => r.DishId)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Restrict);

                // Restaurant review relationship (nullable)
                entity.HasOne(r => r.Restaurant)
                    .WithMany()
                    .HasForeignKey(r => r.RestaurantId)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Restrict);

                // Enforce one review per user per dish
                entity.HasIndex(r => new { r.AuthorId, r.DishId })
                    .IsUnique()
                    .HasFilter("[DishId] IS NOT NULL");

                // Enforce one review per user per restaurant
                entity.HasIndex(r => new { r.AuthorId, r.RestaurantId })
                    .IsUnique()
                    .HasFilter("[RestaurantId] IS NOT NULL");

                // Performance indexes
                entity.HasIndex(r => r.DishId);
                entity.HasIndex(r => r.RestaurantId);
                entity.HasIndex(r => r.AuthorId);
                entity.HasIndex(r => r.Status);
                entity.HasIndex(r => r.CreatedAt);
                entity.HasIndex(r => new { r.DishId, r.Status, r.IsActive });
                entity.HasIndex(r => new { r.RestaurantId, r.Status, r.IsActive });

                // Property constraints
                entity.Property(r => r.Comment)
                    .HasMaxLength(2000);

                entity.Property(r => r.RestaurantReply)
                    .HasMaxLength(2000);

                entity.Property(r => r.Images)
                    .HasMaxLength(4000); 
            });
            modelBuilder.Entity<Book>(entity =>
            {
                entity.HasKey(b => b.Id);
                entity.Property(b => b.Title).IsRequired().HasMaxLength(300);
                entity.Property(b => b.Slug).IsRequired().HasMaxLength(350);
                entity.Property(b => b.Content).IsRequired();
                entity.Property(b => b.Excerpt).HasMaxLength(500);
                entity.Property(b => b.CoverImage).HasMaxLength(1000);
                entity.Property(b => b.Tags).HasMaxLength(4000);
                entity.HasIndex(b => b.Slug).IsUnique();
                entity.HasIndex(b => b.RestaurantId);
                entity.HasIndex(b => new { b.RestaurantId, b.IsPublished, b.IsActive });

                entity.HasOne(b => b.Restaurant)
                      .WithMany()
                      .HasForeignKey(b => b.RestaurantId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            //  Menu
            modelBuilder.Entity<Menu>(entity =>
            {
                entity.HasKey(m => m.Id);
                entity.Property(m => m.Name).IsRequired().HasMaxLength(200);
                entity.Property(m => m.Description).HasMaxLength(1000);
                entity.HasIndex(m => m.RestaurantId);
                entity.HasIndex(m => new { m.RestaurantId, m.IsDefault });

                entity.HasOne(m => m.Restaurant)
                      .WithMany()
                      .HasForeignKey(m => m.RestaurantId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // MenuSection 
            modelBuilder.Entity<MenuSection>(entity =>
            {
                entity.HasKey(s => s.Id);
                entity.Property(s => s.Name).IsRequired().HasMaxLength(200);
                entity.Property(s => s.Description).HasMaxLength(500);
                entity.HasIndex(s => s.MenuId);

                entity.HasOne(s => s.Menu)
                      .WithMany(m => m.Sections)
                      .HasForeignKey(s => s.MenuId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // MenuSectionDish
            modelBuilder.Entity<MenuSectionDish>(entity =>
            {
                entity.HasKey(d => d.Id);
                entity.HasIndex(d => new { d.MenuSectionId, d.DishId }).IsUnique();

                entity.HasOne(d => d.MenuSection)
                      .WithMany(s => s.MenuSectionDishes)
                      .HasForeignKey(d => d.MenuSectionId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.Dish)
                      .WithMany()
                      .HasForeignKey(d => d.DishId)
                      .OnDelete(DeleteBehavior.Restrict); // Don't cascade-delete dishes
            });

            SeedDefaultRoles(modelBuilder);
        }

        private void SeedDefaultRoles(ModelBuilder modelBuilder)
        {
            var adminRoleId = Guid.Parse("11111111-1111-1111-1111-111111111111");
            var customerRoleId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var restaurantRoleId = Guid.Parse("33333333-3333-3333-3333-333333333333");
            var fixedDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);

            modelBuilder.Entity<Role>().HasData(
                new Role
                {
                    Id = adminRoleId,
                    Name = "Admin",
                    Description = "Administrator with full system access",
                    CreatedAt = fixedDate
                },
                new Role
                {
                    Id = customerRoleId,
                    Name = "Customer",
                    Description = "User who can browse and purchase items",
                    CreatedAt = fixedDate
                },
                new Role
                {
                    Id = restaurantRoleId,
                    Name = "Restaurant",
                    Description = "User who can list and sell items",
                    CreatedAt = fixedDate
                }
            );
        }
    }
}