namespace backend.DTOs;

public class LeagueChatMessageDto
{
    public int Id { get; set; }
    public int LeagueChatId { get; set; }
    public Guid SenderUserId { get; set; }
    public string? SenderUsername { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsEdited { get; set; }
    public bool IsDeleted { get; set; }
    public List<MessageReactionDto> Reactions { get; set; } = new();
}
