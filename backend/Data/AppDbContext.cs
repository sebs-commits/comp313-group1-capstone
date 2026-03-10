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
    public DbSet<LeagueMember> LeagueMembers { get; set; }
    public DbSet<Profile> Profiles { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<NbaGame>()
            .HasKey(g => g.GameId);

        modelBuilder.Entity<NbaTeam>()
            .HasKey(t => t.TeamId);

        modelBuilder.Entity<NbaLeague>(b =>
        {
            b.HasKey(l => l.Id);
            b.Ignore(l => l.CreatedBy);
        });

        modelBuilder.Entity<LeagueMember>(b =>
        {
            b.HasKey(lm => lm.Id);
            b.HasIndex(lm => new { lm.LeagueId, lm.UserId }).IsUnique();
            b.HasOne(lm => lm.League)
             .WithMany(l => l.Members)
             .HasForeignKey(lm => lm.LeagueId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }
}