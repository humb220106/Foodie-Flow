using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Core.Validator
{
    public class PasswordValidator
    {
        public const int MinimumLength = 8;
        public const int MaximumLength = 128;

        public static (bool IsValid, string? ErrorMessage) Validate(string password)
        {
            if (string.IsNullOrWhiteSpace(password))
                return (false, "Password is required");

            if (password.Length < MinimumLength)
                return (false, $"Password must be at least {MinimumLength} characters long");

            if (password.Length > MaximumLength)
                return (false, $"Password must not exceed {MaximumLength} characters");

            if (!password.Any(char.IsUpper))
                return (false, "Password must contain at least one uppercase letter");

            if (!password.Any(char.IsLower))
                return (false, "Password must contain at least one lowercase letter");

            if (!password.Any(char.IsDigit))
                return (false, "Password must contain at least one digit");

            if (!password.Any(ch => !char.IsLetterOrDigit(ch)))
                return (false, "Password must contain at least one special character");

            return (true, null);
        }

    }
}
