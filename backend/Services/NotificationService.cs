using backend.Data;
using backend.Models;

namespace backend.Services;

public interface INotificationService
{
    Task CreateAsync(Guid userId, string type, string message);
}

public class NotificationService : INotificationService
{
    private readonly AppDbContext _context;

    public NotificationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task CreateAsync(Guid userId, string type, string message)
    {
        _context.Notifications.Add(new Notification
        {
            UserId = userId,
            Type = type,
            Message = message
        });
        await _context.SaveChangesAsync();
    }
}
