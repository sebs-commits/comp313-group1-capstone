using Xunit;
using Xunit.Abstractions;
using Microsoft.Extensions.Configuration;
using backend.Services;
using backend.DTOs;
using System.Net.Http;
using System.Text;
using System.Linq;
using backend;

namespace Tests;

public class SendInjuryNotificationIntegrationTests
{
    private readonly ITestOutputHelper _output;
    private readonly IConfiguration _configuration;

    public SendInjuryNotificationIntegrationTests(ITestOutputHelper output)
    {
        _output = output;

        _configuration = new ConfigurationBuilder()
            .SetBasePath(AppContext.BaseDirectory)
            .AddJsonFile("appsettings.json", optional: true)
            .AddUserSecrets<SendInjuryNotificationIntegrationTests>()
            .Build();
    }

    [Fact]
    public async Task SendInjuryNotification_ShouldReceiveEmail()
    {
        var emailService = new EmailService(_configuration);
        using var client = new HttpClient();
        client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0");
        var dataService = new LivePlayerDataService(client);

        string testRecipient = _configuration["SendGrid:FromEmail"];
        string subject = "IMPORTANT: Your NBA Fantasy Player Injury Alert";

        if (string.IsNullOrEmpty(testRecipient))
        {
            _output.WriteLine("Error: SendGrid:FromEmail is not configured in secrets or appsettings.");
            return;
        }

        var injuries = await dataService.GetDailyInjuryReportAsync("2026-03-31_01PM");

        var emailBodyBuilder = new StringBuilder();
        emailBodyBuilder.AppendLine("🏀 **Latest NBA Injury Updates** 🏀");
        emailBodyBuilder.AppendLine("-----------------------------------");

        if (injuries != null && injuries.Any())
        {
            foreach (var injury in injuries)
            {
                emailBodyBuilder.AppendLine($"- {injury.Player} ({injury.Team})");
                emailBodyBuilder.AppendLine($"  Status: {injury.Status}");
                emailBodyBuilder.AppendLine($"  Reason: {injury.Description}");
                emailBodyBuilder.AppendLine();
            }
        }
        else
        {
            emailBodyBuilder.AppendLine("No significant injury updates reported for this window.");
        }

        string finalMessage = emailBodyBuilder.ToString();

        _output.WriteLine($"Sending test email to {testRecipient}...");

        var exception = await Record.ExceptionAsync(async () =>
            await emailService.SendEmailAsync(testRecipient, subject, finalMessage)
        );

        Assert.Null(exception);

        _output.WriteLine("--- Email Content Preview ---");
        _output.WriteLine(finalMessage);
        _output.WriteLine("-----------------------------");
        _output.WriteLine("Email sent successfully without exceptions.");
    }
}