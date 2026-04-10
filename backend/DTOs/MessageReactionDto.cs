namespace backend.DTOs;

public class MessageReactionDto
{
    public int Id { get; set; }
    public int MessageId { get; set; }
    public Guid UserId { get; set; }
    public string? Username { get; set; }
    public string Emoji { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
