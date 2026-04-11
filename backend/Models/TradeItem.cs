using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("trade_items")]
public class TradeItem
{
    public int Id { get; set; }
    
    public int TradeId { get; set; }
    public Trade? Trade { get; set; }
    
    // Which team is offering this player
    public int OfferingTeamId { get; set; }
    public FantasyTeam? OfferingTeam { get; set; }
    
    // Player being traded
    public int PlayerId { get; set; }
    public NbaPlayer? Player { get; set; }
}
