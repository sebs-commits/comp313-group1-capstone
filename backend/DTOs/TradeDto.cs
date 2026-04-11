namespace backend.DTOs;

public class TradeDto
{
    public int Id { get; set; }
    public int InitiatingTeamId { get; set; }
    public string? InitiatingTeamName { get; set; }
    public int ReceivingTeamId { get; set; }
    public string? ReceivingTeamName { get; set; }
    public int LeagueId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string? Notes { get; set; }
    public List<TradeItemDto> Items { get; set; } = new List<TradeItemDto>();
}

public class TradeItemDto
{
    public int Id { get; set; }
    public int TradeId { get; set; }
    public int OfferingTeamId { get; set; }
    public int PlayerId { get; set; }
    public string? PlayerName { get; set; }
    public string? TeamName { get; set; }
    public string? Position { get; set; }
}

public class CreateTradeDto
{
    public int ReceivingTeamId { get; set; }
    public List<TradeItemInput> ItemsOffering { get; set; } = new List<TradeItemInput>();
    public List<TradeItemInput> ItemsRequesting { get; set; } = new List<TradeItemInput>();
    public string? Notes { get; set; }
    public int DaysUntilExpiry { get; set; } = 3; 
}

public class TradeItemInput
{
    public int PlayerId { get; set; }
}

public class TradeActionDto
{
    public string Action { get; set; } = string.Empty; 
    public string? Notes { get; set; }
}

public class UpdateTradeDto
{
    public string? Notes { get; set; }
    public int? DaysUntilExpiry { get; set; }
}
