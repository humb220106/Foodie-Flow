using FoodOrdering.Application.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace FoodOrdering.Infrastructure.Services
{
    public class PasswordHasher : IPasswordHasher
    {
        private const int SaltSize = 16;
        private const int KeySize = 32;
        private const int Iterations = 100_000;
        private static readonly HashAlgorithmName HashAlgorithm = HashAlgorithmName.SHA256;
        private const char Delimiter = ';';
        public string HashPassword(string password)
        {
            if (password == null) throw new ArgumentNullException(nameof(password));

            var salt = RandomNumberGenerator.GetBytes(SaltSize);
            var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, HashAlgorithm, KeySize);


            return string.Join(Delimiter, "v1", Iterations.ToString(), Convert.ToBase64String(salt), Convert.ToBase64String(hash));
        }

        public bool VerifyPassword(string password, string passwordHash)
        {
            if (string.IsNullOrWhiteSpace(passwordHash) || password == null) return false;

            var parts = passwordHash.Split(Delimiter);
            if (parts.Length == 4 && parts[0] == "v1")
            {
                if (!int.TryParse(parts[1], out int iterations)) return false;
                var salt = Convert.FromBase64String(parts[2]);
                var storedHash = Convert.FromBase64String(parts[3]);

                var computedHash = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithm, storedHash.Length);
                return CryptographicOperations.FixedTimeEquals(storedHash, computedHash);
            }


            return false;
        }
    }
}
