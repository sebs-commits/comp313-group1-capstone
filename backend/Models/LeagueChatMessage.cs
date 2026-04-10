using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("league_chat_messages")]
public class LeagueChatMessage
{
    public int Id { get; set; }
    public int LeagueChatId { get; set; }
    public Guid SenderUserId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsEdited { get; set; } = false;
    public bool IsDeleted { get; set; } = false;

    public LeagueChat? LeagueChat { get; set; }
    public ICollection<MessageReaction> Reactions { get; set; } = new List<MessageReaction>();
}
