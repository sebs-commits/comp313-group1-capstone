using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace backend;

public class ScoreboardDto
{
    [JsonPropertyName("scoreboard")]
    public ScoreboardData Scoreboard { get; set; } = new();
}

public class ScoreboardData
{
    public string GameDate { get; set; } = string.Empty;
    public string LeagueId { get; set; } = string.Empty;
    public List<LiveGame> Games { get; set; } = new();
}

public class LiveGame
{
    public string GameId { get; set; } = string.Empty;
    
    // Changed to string because the API sends values like "20240301/LALDEN"
    public string GameCode { get; set; } = string.Empty;
    
    public int GameStatus { get; set; }
    public string GameStatusText { get; set; } = string.Empty;

    [JsonPropertyName("period")]
    public int Period { get; set; } // The API often sends period as a single int

    public LiveTeamData HomeTeam { get; set; } = new();
    public LiveTeamData AwayTeam { get; set; } = new();
}

public class LiveTeamData
{
    public int TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public string TeamCity { get; set; } = string.Empty;
    public string TeamTricode { get; set; } = string.Empty;
    public int Score { get; set; }
}
