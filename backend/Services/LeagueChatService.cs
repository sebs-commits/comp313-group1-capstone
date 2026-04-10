using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class LeagueChatService : ILeagueChatService
{
    private readonly AppDbContext _context;

    public LeagueChatService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<LeagueChat> GetOrCreateLeagueChatAsync(int leagueId)
    {
        var leagueChat = await _context.LeagueChats
            .FirstOrDefaultAsync(lc => lc.LeagueId == leagueId);

        if (leagueChat != null)
        {
            return leagueChat;
        }

        leagueChat = new LeagueChat
        {
            LeagueId = leagueId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.LeagueChats.Add(leagueChat);
        await _context.SaveChangesAsync();
        return leagueChat;
    }

    public async Task<LeagueChatMessage> SendMessageAsync(int leagueId, Guid senderId, string content)
    {
        // Get or create league chat
        var leagueChat = await GetOrCreateLeagueChatAsync(leagueId);

        var message = new LeagueChatMessage
        {
            LeagueChatId = leagueChat.Id,
            SenderUserId = senderId,
            Content = content,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsEdited = false,
            IsDeleted = false
        };
        
        _context.LeagueChatMessages.Add(message);
        leagueChat.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return message;
    }

    public async Task<ChatHistoryResponseDto> GetChatHistoryAsync(int leagueId, int? limit = 50, int? offset = 0)
    {
        var leagueChat = await _context.LeagueChats
            .FirstOrDefaultAsync(lc => lc.LeagueId == leagueId);

        if (leagueChat == null)
            throw new KeyNotFoundException($"League chat not found for league {leagueId}");

        var messages = await _context.LeagueChatMessages
            .Where(m => m.LeagueChatId == leagueChat.Id && !m.IsDeleted)
            .OrderByDescending(m => m.CreatedAt)
            .Skip(offset ?? 0)
            .Take(limit ?? 50)
            .Include(m => m.Reactions)
            .ToListAsync();

        // Get sender usernames
        var senderIds = messages.Select(m => m.SenderUserId).Distinct().ToList();
        var profiles = await _context.Profiles
            .Where(p => senderIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, p => p.Username);

        // Get reaction user profiles
        var reactionUserIds = messages
            .SelectMany(m => m.Reactions.Select(r => r.UserId))
            .Distinct()
            .ToList();
        
        var reactionProfiles = await _context.Profiles
            .Where(p => reactionUserIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, p => p.Username);

        var messageDtos = messages
            .OrderBy(m => m.CreatedAt)
            .Select(m => new LeagueChatMessageDto
            {
                Id = m.Id,
                LeagueChatId = m.LeagueChatId,
                SenderUserId = m.SenderUserId,
                SenderUsername = profiles.ContainsKey(m.SenderUserId) ? profiles[m.SenderUserId] : "Unknown",
                Content = m.Content,
                CreatedAt = m.CreatedAt,
                UpdatedAt = m.UpdatedAt,
                IsEdited = m.IsEdited,
                IsDeleted = m.IsDeleted,
                Reactions = m.Reactions
                    .Select(r => new MessageReactionDto
                    {
                        Id = r.Id,
                        MessageId = m.Id,
                        UserId = r.UserId,
                        Username = reactionProfiles.ContainsKey(r.UserId) ? reactionProfiles[r.UserId] : "Unknown",
                        Emoji = r.Emoji,
                        CreatedAt = r.CreatedAt
                    })
                    .ToList()
            })
            .ToList();

        return new ChatHistoryResponseDto
        {
            LeagueChatId = leagueChat.Id,
            LeagueId = leagueId,
            Messages = messageDtos
        };
    }

    public async Task<LeagueChatMessage> EditMessageAsync(int messageId, Guid userId, string newContent)
    {
        var message = await _context.LeagueChatMessages
            .FirstOrDefaultAsync(m => m.Id == messageId);

        if (message == null)
            throw new KeyNotFoundException("Message not found");

        if (message.SenderUserId != userId)
            throw new UnauthorizedAccessException("You can only edit your own messages");

        message.Content = newContent;
        message.IsEdited = true;
        message.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return message;
    }

    public async Task DeleteMessageAsync(int messageId, Guid userId)
    {
        var message = await _context.LeagueChatMessages
            .FirstOrDefaultAsync(m => m.Id == messageId);

        if (message == null)
            throw new KeyNotFoundException("Message not found");

        if (message.SenderUserId != userId)
            throw new UnauthorizedAccessException("You can only delete your own messages");

        message.IsDeleted = true;
        message.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    public async Task<MessageReaction> AddReactionAsync(int messageId, Guid userId, string emoji)
    {
        var message = await _context.LeagueChatMessages
            .FirstOrDefaultAsync(m => m.Id == messageId);

        if (message == null)
            throw new KeyNotFoundException("Message not found");

        // Check if reaction already exists
        var existingReaction = await _context.MessageReactions
            .FirstOrDefaultAsync(r => r.MessageId == messageId && r.UserId == userId && r.Emoji == emoji);

        if (existingReaction != null)
            return existingReaction;

        var reaction = new MessageReaction
        {
            MessageId = messageId,
            UserId = userId,
            Emoji = emoji,
            CreatedAt = DateTime.UtcNow
        };

        _context.MessageReactions.Add(reaction);
        await _context.SaveChangesAsync();
        return reaction;
    }

    public async Task RemoveReactionAsync(int messageId, Guid userId, string emoji)
    {
        var reaction = await _context.MessageReactions
            .FirstOrDefaultAsync(r => r.MessageId == messageId && r.UserId == userId && r.Emoji == emoji);

        if (reaction != null)
        {
            _context.MessageReactions.Remove(reaction);
            await _context.SaveChangesAsync();
        }
    }
}
