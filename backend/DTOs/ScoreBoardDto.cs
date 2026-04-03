using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace backend;

public class ScoreboardDto
{
    [JsonPropertyName("meta")]
    public ScoreboardMeta Meta { get; set; } = new();

    [JsonPropertyName("scoreboard")]
    public ScoreboardData Scoreboard { get; set; } = new();
}

public class ScoreboardMeta
{
    public int Version { get; set; }
    public string Request { get; set; } = string.Empty;
    public string Time { get; set; } = string.Empty;
    public int Code { get; set; }
}

public class ScoreboardData
{
    public string GameDate { get; set; } = string.Empty;
    public string LeagueId { get; set; } = string.Empty;
    public string LeagueName { get; set; } = string.Empty;
    public List<LiveGame> Games { get; set; } = new();
}

public class LiveGame
{
    public string GameId { get; set; } = string.Empty;
    
    // Changed to string because the API sends values like "20240301/LALDEN"
    public string GameCode { get; set; } = string.Empty;
    
    public int GameStatus { get; set; }
    public string GameStatusText { get; set; } = string.Empty;
    public string GameClock { get; set; } = string.Empty;
    public string GameTimeUTC { get; set; } = string.Empty;
    public string GameEt { get; set; } = string.Empty;

    [JsonPropertyName("period")]
    public int Period { get; set; } // The API often sends period as a single int

    public int RegulationPeriods { get; set; }
    public bool IsNeutral { get; set; }

    public LiveTeamData HomeTeam { get; set; } = new();
    public LiveTeamData AwayTeam { get; set; } = new();
    public GameLeadersData GameLeaders { get; set; } = new();
    public PbOddsData PbOdds { get; set; } = new();

    // Convenience fields for frontend clients.
    public int ScoreDifference => Math.Abs(HomeTeam.Score - AwayTeam.Score);
    public string? LeadingTeamTricode =>
        HomeTeam.Score == AwayTeam.Score
            ? null
            : (HomeTeam.Score > AwayTeam.Score ? HomeTeam.TeamTricode : AwayTeam.TeamTricode);
    public bool IsLive => GameStatus == 2;
    public bool IsFinal => GameStatus == 3;

    public GameLeader? TopScorer
    {
        get
        {
            var homeLeader = GameLeaders.HomeLeaders;
            var awayLeader = GameLeaders.AwayLeaders;

            if ((homeLeader?.Points ?? 0) <= 0 && (awayLeader?.Points ?? 0) <= 0)
            {
                return null;
            }

            return (homeLeader?.Points ?? 0) >= (awayLeader?.Points ?? 0)
                ? homeLeader
                : awayLeader;
        }
    }
}

public class LiveTeamData
{
    public int TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public string TeamCity { get; set; } = string.Empty;
    public string TeamTricode { get; set; } = string.Empty;
    public int Wins { get; set; }
    public int Losses { get; set; }
    public int Score { get; set; }
    public int? Seed { get; set; }
    public string? InBonus { get; set; }
    public int TimeoutsRemaining { get; set; }
    public List<PeriodScoreData> Periods { get; set; } = new();

    public string Record => $"{Wins}-{Losses}";
}

public class PeriodScoreData
{
    public int Period { get; set; }
    public string PeriodType { get; set; } = string.Empty;
    public int Score { get; set; }
}

public class GameLeadersData
{
    public GameLeader HomeLeaders { get; set; } = new();
    public GameLeader AwayLeaders { get; set; } = new();
}

public class GameLeader
{
    public int PersonId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string JerseyNum { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public string TeamTricode { get; set; } = string.Empty;
    public string? PlayerSlug { get; set; }
    public int Points { get; set; }
    public int Rebounds { get; set; }
    public int Assists { get; set; }
    public int Steals { get; set; } 
    public int Blocks { get; set; } 
}

public class PbOddsData
{
    public string? Team { get; set; }
    public decimal Odds { get; set; }
    public int Suspended { get; set; }
}
