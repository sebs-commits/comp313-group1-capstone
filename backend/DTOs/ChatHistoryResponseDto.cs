namespace backend.DTOs;

public class SendChatMessageDto
{
    public string Content { get; set; } = string.Empty;
}

public class ChatHistoryResponseDto
{
    public int LeagueChatId { get; set; }
    public int LeagueId { get; set; }
    public List<LeagueChatMessageDto> Messages { get; set; } = new();
}
