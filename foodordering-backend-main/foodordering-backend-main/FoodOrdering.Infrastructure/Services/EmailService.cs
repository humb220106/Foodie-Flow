using System;
using System.Net.Mail;
using System.Threading.Tasks;

using FoodOrdering.Application.Interfaces;
using MailKit.Net.Smtp;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;

namespace FoodOrdering.Infrastructure.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        private async Task SendEmailAsync(string toEmail, string toName, string subject, string htmlBody)
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(
                _configuration["Email:FromName"],
                _configuration["Email:FromEmail"]
            ));
            message.To.Add(new MailboxAddress(toName, toEmail));
            message.Subject = subject;
            message.Body = new TextPart("html") { Text = htmlBody };

            try
            {
                using var client = new MailKit.Net.Smtp.SmtpClient();
                await client.ConnectAsync(
                    _configuration["Email:SmtpHost"],
                    int.Parse(_configuration["Email:SmtpPort"]),
                    bool.Parse(_configuration["Email:SmtpUseSsl"])
                );

                if (!string.IsNullOrEmpty(_configuration["Email:SmtpUser"]))
                {
                    await client.AuthenticateAsync(
                        _configuration["Email:SmtpUser"],
                        _configuration["Email:SmtpPass"]
                    );
                }

                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                _logger.LogInformation("Email sent to {Email} with subject '{Subject}'", toEmail, subject);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
            }
        }

        public async Task SendEmailVerificationAsync(string email, string username, string token)
        {
            var verificationUrl = $"{_configuration["App:FrontendUrl"]}/verify-email?token={token}";
            var subject = "Verify Your Email";
            var htmlBody = $"<p>Hi {username},</p><p>Please verify your email by clicking <a href='{verificationUrl}'>here</a>.</p>";

            await SendEmailAsync(email, username, subject, htmlBody);
        }

        public async Task SendLoginNotificationAsync(string email, string username, string ipAddress)
        {
            var subject = "New Login Notification";
            var htmlBody = $"<p>Hi {username},</p><p>We detected a login from IP address: {ipAddress}.</p>";

            await SendEmailAsync(email, username, subject, htmlBody);
        }

        public async Task SendPasswordResetAsync(string email, string username, string token)
        {
            var resetUrl = $"{_configuration["App:FrontendUrl"]}/reset-password?token={token}";
            var subject = "Password Reset Request";
            var htmlBody = $"<p>Hi {username},</p><p>You can reset your password by clicking <a href='{resetUrl}'>here</a>.</p>";

            await SendEmailAsync(email, username, subject, htmlBody);
        }
    }
}
