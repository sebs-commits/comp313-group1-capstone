using backend.DTOs;
using backend.Models;

namespace backend.Services;

public interface ILeagueChatService
{
    Task<LeagueChat> GetOrCreateLeagueChatAsync(int leagueId);
    Task<LeagueChatMessage> SendMessageAsync(int leagueId, Guid senderId, string content);
    Task<ChatHistoryResponseDto> GetChatHistoryAsync(int leagueId, int? limit = 50, int? offset = 0);
    Task<LeagueChatMessage> EditMessageAsync(int messageId, Guid userId, string newContent);
    Task DeleteMessageAsync(int messageId, Guid userId);
    Task<MessageReaction> AddReactionAsync(int messageId, Guid userId, string emoji);
    Task RemoveReactionAsync(int messageId, Guid userId, string emoji);
}
