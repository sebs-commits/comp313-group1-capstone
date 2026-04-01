using Xunit;
using Xunit.Abstractions;
using backend.Services;
using backend;

namespace Tests;

public class LivePlayerDataIntegrationTests
{
    private readonly ITestOutputHelper _output;

    public LivePlayerDataIntegrationTests(ITestOutputHelper output)
    {
        _output = output;
    }

    [Fact]
    public async Task GetScoreboard_ShouldReturnData()
    {
        using var client = new HttpClient();
        client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0");

        var service = new LivePlayerDataService(client);
        var result = await service.GetTodaysScoreboardAsync();

        Assert.NotNull(result);

        if (result.Scoreboard?.Games != null)
        {
            foreach (var game in result.Scoreboard.Games)
            {
                _output.WriteLine($"Parsed Game: {game.AwayTeam.TeamName} @ {game.HomeTeam.TeamName}");
            }
        }
    }
}