namespace backend.DTOs;

public class BoxScoreDto
{
    public GameData Game { get; set; }
}

public class GameData
{
    public string GameId { get; set; }
    public TeamData HomeTeam { get; set; }
    public TeamData AwayTeam { get; set; }
}

public class TeamData
{
    public string TeamName { get; set; }
    public int Score { get; set; }
    public List<PlayerBoxScore> Players { get; set; }
}

public class PlayerBoxScore
{
    public string Name { get; set; }
    public string Position { get; set; }
    public Statistics Statistics { get; set; }
}

public class Statistics
{
    public int Points { get; set; }
    public int Assists { get; set; }
    public int ReboundsTotal { get; set; }
    public int Steals { get; set; }
    public string Minutes { get; set; }
}