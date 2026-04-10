using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("message_reactions")]
public class MessageReaction
{
    public int Id { get; set; }
    public int MessageId { get; set; }
    public Guid UserId { get; set; }
    public string Emoji { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public LeagueChatMessage? Message { get; set; }
}
