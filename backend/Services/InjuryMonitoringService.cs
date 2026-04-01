using System.Text;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using backend.Services;
using backend.DTOs;

namespace backend.Services;

public class InjuryUpdateWorker : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly IConfiguration _configuration;
    private readonly TimeSpan _scheduleTime = new TimeSpan(13, 30, 0); // 1:30 PM

    public InjuryUpdateWorker(IServiceProvider services, IConfiguration configuration)
    {
        _services = services;
        _configuration = configuration;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTime.Now;
            var nextRun = now.Date.Add(_scheduleTime);

            // If we already passed the scheduled time today, schedule for tomorrow
            if (now > nextRun)
            {
                nextRun = nextRun.AddDays(1);
            }

            var delay = nextRun - now;

            await Task.Delay(delay, stoppingToken);

            await FetchAndNotify();
        }
    }

    private async Task FetchAndNotify()
    {
        using var scope = _services.CreateScope();
        var dataService = scope.ServiceProvider.GetRequiredService<ILivePlayerDataService>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

        string timestamp = DateTime.Now.ToString("yyyy-MM-dd") + "_01PM";

        var injuries = await dataService.GetDailyInjuryReportAsync(timestamp);
        var emailBody = new StringBuilder();

        if (injuries != null && injuries.Any())
        {
            emailBody.AppendLine("🏀 **Daily NBA Injury Report Update** 🏀");
            emailBody.AppendLine("---------------------------------------");

            foreach (var injury in injuries)
            {
                emailBody.AppendLine($"- {injury.Player} ({injury.Team})");
                emailBody.AppendLine($"  Status: {injury.Status}");
                emailBody.AppendLine($"  Details: {injury.Description}");
                emailBody.AppendLine();
            }

            string recipient = _configuration["SendGrid:FromEmail"];
            string subject = $"NBA Injury Alert: {DateTime.Now:MMMM dd, yyyy}";

            await emailService.SendEmailAsync(recipient, subject, emailBody.ToString());
        }
        
    }
}