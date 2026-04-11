using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("trades")]
public class Trade
{
    public int Id { get; set; }
    
    // Team offering the trade
    public int InitiatingTeamId { get; set; }
    public FantasyTeam? InitiatingTeam { get; set; }
    
    // Team receiving the trade
    public int ReceivingTeamId { get; set; }
    public FantasyTeam? ReceivingTeam { get; set; }
    
    // League ID for validation
    public int LeagueId { get; set; }
    public NbaLeague? League { get; set; }
    
    // Status: pending, accepted, declined, expired
    public string Status { get; set; } = "pending"; // pending, accepted, declined, cancelled, expired
    
    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    
    // Notes
    public string? Notes { get; set; }
    
    public ICollection<TradeItem> Items { get; set; } = new List<TradeItem>();
}
