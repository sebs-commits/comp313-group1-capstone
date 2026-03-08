namespace backend.DTOs;

public class CreateLeagueDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsPublic { get; set; } = true;
    public Guid CreatedByUserId { get; set; }
}

public class JoinLeagueDto
{
    public Guid UserId { get; set; }
    public string? InviteCode { get; set; }
}

public class LeagueResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsPublic { get; set; }
    public string? InviteCode { get; set; }
    public Guid CreatedByUserId { get; set; }
    public int MemberCount { get; set; }
}