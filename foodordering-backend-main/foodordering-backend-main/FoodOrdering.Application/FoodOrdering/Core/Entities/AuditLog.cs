//using FoodOrdering.Application.DTOs.Admin;
//using FoodOrdering.Application.Interfaces;
//using FoodOrdering.Application.Repositories;
//using FoodOrdering.Core.Enums;
//using Microsoft.Extensions.Logging;







namespace FoodOrdering.Core.Entities
{
    internal class AuditLog : Enums.AuditLog
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Action { get; set; }
        public string Details { get; set; }
        public string IpAddress { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsSuccess { get; set; }
    }
}