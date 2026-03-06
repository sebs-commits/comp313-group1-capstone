using Xunit;
using Xunit.Abstractions;
using Microsoft.EntityFrameworkCore; 
using backend.Data;                  
using backend.Models;                

namespace Tests;

public class RetrieveUserLeaguesTest
{
    private readonly ITestOutputHelper _output;

    public RetrieveUserLeaguesTest(ITestOutputHelper output)
    {
        _output = output;
    }

    [Fact]
    public async Task GetLeagues_ShouldPrintData()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestLeagueDb")
            .Options;

        using (var context = new AppDbContext(options))
        {
            context.Leagues.Add(new NbaLeague { Name = "NBA Sunday Night", Description = "Pro League" });
            await context.SaveChangesAsync();
        }

        using (var context = new AppDbContext(options))
        {
            var leagues = await context.Leagues.ToListAsync();

            _output.WriteLine($"Total Leagues: {leagues.Count}");

            foreach (var league in leagues)
            {
                _output.WriteLine($"League: {league.Name} - {league.Description}");
            }

            Assert.NotEmpty(leagues);
        }
    }
}