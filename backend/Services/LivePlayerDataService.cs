using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using backend.DTOs;
using Microsoft.Extensions.Configuration;
using System.Linq;

namespace backend;

public class LivePlayerDataService : ILivePlayerDataService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration? _configuration;

    public LivePlayerDataService(HttpClient httpClient, IConfiguration? configuration = null)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public async Task<ScoreboardDto?> GetTodaysScoreboardAsync()
    {
        var url = "https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json";
        var response = await _httpClient.GetAsync(url);
        if (!response.IsSuccessStatusCode) return null;

        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<ScoreboardDto>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    }

    public async Task<List<InjuryReportDto>?> GetDailyInjuryReportAsync(string date)
    {
        // The RapidAPI URL structure from your snippet
        var url = $"https://nba-injuries-reports.p.rapidapi.com/injuries/nba/{date}";

        var request = new HttpRequestMessage
        {
            Method = HttpMethod.Get,
            RequestUri = new Uri(url),
            Headers =
        {
            { "x-rapidapi-key", _configuration["RapidAPI:Key"] },
            { "x-rapidapi-host", _configuration["RapidAPI:Host"] },
        },
        };

        var response = await _httpClient.SendAsync(request);

        if (!response.IsSuccessStatusCode) return null;

        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<List<InjuryReportDto>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
    }

    public async Task<BoxScoreDto?> GetLiveBoxScoreAsync(string gameId)
    {
        var url = $"https://cdn.nba.com/static/json/liveData/boxscore/boxscore_{gameId}.json";
        var response = await _httpClient.GetAsync(url);
        if (!response.IsSuccessStatusCode) return null;

        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<BoxScoreDto>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    }

    public async Task<PlayerStatsDto?> GetPlayerCareerStatsAsync(string playerId)
    {
        return null;
    }

    public async Task<List<TeamDto>> GetAllTeamsAsync()
    {
        try
        {
            var season = GetCurrentSeason();
            var url = $"https://stats.nba.com/stats/commonteamslist?LeagueID=00&Season={season}";
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
            var response = await _httpClient.GetAsync(url, cts.Token);
            if (!response.IsSuccessStatusCode) return new List<TeamDto>();

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            var resultSets = doc.RootElement.GetProperty("resultSets");
            var teamListSet = resultSets.EnumerateArray()
                .FirstOrDefault(rs => rs.GetProperty("name").GetString() == "CommonTeamList");

            if (teamListSet.ValueKind == JsonValueKind.Undefined)
                return new List<TeamDto>();

            var headers = teamListSet.GetProperty("headers").EnumerateArray()
                .Select(h => h.GetString()).ToList();

            int teamIdIdx    = headers.IndexOf("TEAM_ID");
            int abbrevIdx    = headers.IndexOf("ABBREVIATION");
            int nicknameIdx  = headers.IndexOf("NICKNAME");
            int cityIdx      = headers.IndexOf("CITY");

            var teams = new List<TeamDto>();
            foreach (var row in teamListSet.GetProperty("rowSet").EnumerateArray())
            {
                var cols = row.EnumerateArray().ToList();
                teams.Add(new TeamDto
                {
                    TeamId       = cols[teamIdIdx].GetInt32(),
                    FullName     = $"{cols[cityIdx].GetString()} {cols[nicknameIdx].GetString()}",
                    Abbreviation = cols[abbrevIdx].GetString()
                });
            }

            return teams.OrderBy(t => t.FullName).ToList();
        }
        catch
        {
            return new List<TeamDto>();
        }
    }

    public async Task<List<PlayerDto>> GetTeamRosterAsync(int teamId)
    {
        try
        {
        var season = GetCurrentSeason();
        var url = $"https://stats.nba.com/stats/commonteamroster?TeamID={teamId}&Season={season}";
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        var response = await _httpClient.GetAsync(url, cts.Token);
        if (!response.IsSuccessStatusCode) return new List<PlayerDto>();

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        var resultSets = doc.RootElement.GetProperty("resultSets");
        var rosterSet = resultSets.EnumerateArray()
            .FirstOrDefault(rs => rs.GetProperty("name").GetString() == "CommonTeamRoster");

        if (rosterSet.ValueKind == JsonValueKind.Undefined)
            return new List<PlayerDto>();

        var headers = rosterSet.GetProperty("headers").EnumerateArray()
            .Select(h => h.GetString()).ToList();

        int playerIdIdx  = headers.IndexOf("PLAYER_ID");
        int playerIdx    = headers.IndexOf("PLAYER");
        int numIdx       = headers.IndexOf("NUM");
        int posIdx       = headers.IndexOf("POSITION");

        var players = new List<PlayerDto>();
        foreach (var row in rosterSet.GetProperty("rowSet").EnumerateArray())
        {
            var cols = row.EnumerateArray().ToList();
            players.Add(new PlayerDto
            {
                PlayerId     = cols[playerIdIdx].GetInt32(),
                FullName     = cols[playerIdx].GetString(),
                Position     = cols[posIdx].GetString(),
                JerseyNumber = cols[numIdx].GetString()
            });
        }

        return players.OrderBy(p => p.FullName).ToList();
        }
        catch
        {
            return new List<PlayerDto>();
        }
    }

    public async Task<Dictionary<int, CdnPlayerStatsDto>> GetPlayerStatsForWindowAsync(DateOnly start, DateOnly end)
    {
        var aggregated = new Dictionary<int, CdnPlayerStatsDto>();

        try
        {
            // Get game IDs in the window from the schedule
            var scheduleUrl = "https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_1.json";
            using var scheduleCts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
            var scheduleResponse = await _httpClient.GetAsync(scheduleUrl, scheduleCts.Token);
            if (!scheduleResponse.IsSuccessStatusCode) return aggregated;

            var scheduleJson = await scheduleResponse.Content.ReadAsStringAsync();
            using var scheduleDoc = JsonDocument.Parse(scheduleJson);

            var gameIds = new List<string>();
            foreach (var dateEntry in scheduleDoc.RootElement
                .GetProperty("leagueSchedule")
                .GetProperty("gameDates")
                .EnumerateArray())
            {
                foreach (var game in dateEntry.GetProperty("games").EnumerateArray())
                {
                    var dateStr = game.GetProperty("gameDateEst").GetString();
                    if (dateStr is null) continue;
                    if (!DateOnly.TryParse(dateStr[..10], out var gameDate)) continue;
                    if (gameDate < start || gameDate > end) continue;

                    // Only include completed games (status 3 = Final)
                    if (game.GetProperty("gameStatus").GetInt32() != 3) continue;

                    gameIds.Add(game.GetProperty("gameId").GetString()!);
                }
            }

            // Fetch box score for each game and aggregate player stats
            foreach (var gameId in gameIds)
            {
                try
                {
                    var boxUrl = $"https://cdn.nba.com/static/json/liveData/boxscore/boxscore_{gameId}.json";
                    using var boxCts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
                    var boxResponse = await _httpClient.GetAsync(boxUrl, boxCts.Token);
                    if (!boxResponse.IsSuccessStatusCode) continue;

                    var boxJson = await boxResponse.Content.ReadAsStringAsync();
                    using var boxDoc = JsonDocument.Parse(boxJson);
                    var gameEl = boxDoc.RootElement.GetProperty("game");

                    foreach (var teamKey in new[] { "homeTeam", "awayTeam" })
                    {
                        foreach (var player in gameEl.GetProperty(teamKey).GetProperty("players").EnumerateArray())
                        {
                            if (player.GetProperty("played").GetString() != "1") continue;

                            var playerId = player.GetProperty("personId").GetInt32();
                            var s = player.GetProperty("statistics");

                            if (!aggregated.TryGetValue(playerId, out var entry))
                            {
                                entry = new CdnPlayerStatsDto { PlayerId = playerId };
                                aggregated[playerId] = entry;
                            }

                            entry.Points           += s.GetProperty("points").GetInt32();
                            entry.Rebounds         += s.GetProperty("reboundsTotal").GetInt32();
                            entry.Assists          += s.GetProperty("assists").GetInt32();
                            entry.Steals           += s.GetProperty("steals").GetInt32();
                            entry.Blocks           += s.GetProperty("blocks").GetInt32();
                            entry.Turnovers        += s.GetProperty("turnovers").GetInt32();
                            entry.ThreePointersMade += s.GetProperty("threePointersMade").GetInt32();
                        }
                    }
                }
                catch
                {
                    // Skip individual box scores that fail
                    continue;
                }
            }
        }
        catch
        {
            return aggregated;
        }

        return aggregated;
    }

    public async Task<List<int>> GetTeamIdsWithGamesInWindowAsync(DateOnly start, DateOnly end)
    {
        try
        {
            var url = "https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_1.json";
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
            var response = await _httpClient.GetAsync(url, cts.Token);
            if (!response.IsSuccessStatusCode) return new List<int>();

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            var gameDates = doc.RootElement
                .GetProperty("leagueSchedule")
                .GetProperty("gameDates");

            var teamIds = new HashSet<int>();

            foreach (var dateEntry in gameDates.EnumerateArray())
            {
                foreach (var game in dateEntry.GetProperty("games").EnumerateArray())
                {
                    var dateStr = game.GetProperty("gameDateEst").GetString();
                    if (dateStr is null) continue;

                    // gameDateEst is ISO format: "2026-04-18T00:00:00Z"
                    if (!DateOnly.TryParse(dateStr[..10], out var gameDate)) continue;
                    if (gameDate < start || gameDate > end) continue;

                    var homeId = game.GetProperty("homeTeam").GetProperty("teamId").GetInt32();
                    var awayId = game.GetProperty("awayTeam").GetProperty("teamId").GetInt32();

                    // teamId of 0 means matchup not yet determined — skip
                    if (homeId > 0) teamIds.Add(homeId);
                    if (awayId > 0) teamIds.Add(awayId);
                }
            }

            return teamIds.ToList();
        }
        catch
        {
            return new List<int>();
        }
    }

    private static string GetCurrentSeason()
    {
        var now = DateTime.UtcNow;
        int startYear = now.Month >= 10 ? now.Year : now.Year - 1;
        return $"{startYear}-{(startYear + 1) % 100:D2}";
    }
}