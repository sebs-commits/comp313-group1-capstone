using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("league_chats")]
public class LeagueChat
{
    public int Id { get; set; }
    public int LeagueId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public NbaLeague? League { get; set; }
    public ICollection<LeagueChatMessage> Messages { get; set; } = new List<LeagueChatMessage>();
}
