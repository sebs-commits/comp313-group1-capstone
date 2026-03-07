using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<NbaTeam> NbaTeams { get; set; }
    public DbSet<NbaGame> NbaGames { get; set; }
    public DbSet<NbaPlayer> NbaPlayers { get; set; }
    public DbSet<NbaPlayerGameStats> NbaPlayerGameStats { get; set; }
    public DbSet<NbaLeague> Leagues { get; set; }
    public DbSet<Profile> Profiles { get; set; }

    // TODO: Create models for other tables (users, transactions,
    // TODO: transaction_details, leagues, fantasy_teams, fantasy_rosters, draft_picks, fantasy_scores)

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<NbaGame>()
            .HasKey(g => g.GameId);

        modelBuilder.Entity<NbaLeague>()
            .HasKey(l => l.Id);

        modelBuilder.Entity<NbaTeam>()
            .HasKey(t => t.TeamId);
    }
}