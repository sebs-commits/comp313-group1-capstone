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
    public DbSet<FantasyTeam> FantasyTeams { get; set; }
    public DbSet<FantasyRoster> FantasyRosters { get; set; }
    public DbSet<Warning> Warnings { get; set; }
    public DbSet<DraftSession> DraftSessions { get; set; }
    public DbSet<DraftOrder> DraftOrders { get; set; }
    public DbSet<DraftPick> DraftPicks { get; set; }
    public DbSet<LeagueChat> LeagueChats { get; set; }
    public DbSet<LeagueChatMessage> LeagueChatMessages { get; set; }
    public DbSet<MessageReaction> MessageReactions { get; set; }
    public DbSet<Trade> Trades { get; set; }
    public DbSet<TradeItem> TradeItems { get; set; }
    public DbSet<Notification> Notifications { get; set; }

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

        modelBuilder.Entity<FantasyTeam>(b =>
        {
            b.HasKey(ft => ft.Id);
            b.HasIndex(ft => new { ft.LeagueId, ft.UserId }).IsUnique();
            b.HasOne(ft => ft.League)
             .WithMany(l => l.Teams)
             .HasForeignKey(ft => ft.LeagueId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<FantasyRoster>(b =>
        {
            b.HasKey(fr => fr.Id);
            b.HasOne(fr => fr.FantasyTeam)
             .WithMany(ft => ft.Roster)
             .HasForeignKey(fr => fr.FantasyTeamId)
             .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(fr => fr.Player)
             .WithMany()
             .HasForeignKey(fr => fr.PlayerId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Warning>(b =>
        {
            b.HasKey(w => w.Id);
            b.HasOne(w => w.User)
             .WithMany()
             .HasForeignKey(w => w.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DraftSession>(b =>
        {
            b.HasKey(ds => ds.Id);
            b.HasOne(ds => ds.League)
             .WithMany()
             .HasForeignKey(ds => ds.LeagueId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DraftOrder>(b =>
        {
            b.HasKey(o => o.Id);
            b.HasOne(o => o.DraftSession)
             .WithMany(ds => ds.DraftOrder)
             .HasForeignKey(o => o.DraftSessionId)
             .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(o => o.FantasyTeam)
             .WithMany()
             .HasForeignKey(o => o.FantasyTeamId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DraftPick>(b =>
        {
            b.HasKey(p => p.Id);
            b.HasOne(p => p.DraftSession)
             .WithMany(ds => ds.Picks)
             .HasForeignKey(p => p.DraftSessionId)
             .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(p => p.FantasyTeam)
             .WithMany()
             .HasForeignKey(p => p.FantasyTeamId)
             .OnDelete(DeleteBehavior.Restrict);
            b.HasOne(p => p.Player)
             .WithMany()
             .HasForeignKey(p => p.PlayerId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<LeagueChat>(b =>
        {
            b.HasKey(lc => lc.Id);
            b.HasOne(lc => lc.League)
             .WithMany()
             .HasForeignKey(lc => lc.LeagueId)
             .OnDelete(DeleteBehavior.Cascade);
            b.HasIndex(lc => lc.LeagueId).IsUnique();
        });

        modelBuilder.Entity<LeagueChatMessage>(b =>
        {
            b.HasKey(lcm => lcm.Id);
            b.HasOne(lcm => lcm.LeagueChat)
             .WithMany(lc => lc.Messages)
             .HasForeignKey(lcm => lcm.LeagueChatId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MessageReaction>(b =>
         {
             b.HasKey(mr => mr.Id);
             b.HasOne(mr => mr.Message)
              .WithMany(lcm => lcm.Reactions)
              .HasForeignKey(mr => mr.MessageId)
              .OnDelete(DeleteBehavior.Cascade);
             b.HasIndex(mr => new { mr.MessageId, mr.UserId, mr.Emoji }).IsUnique();
         });

        modelBuilder.Entity<Trade>(b =>
        {
            b.HasKey(t => t.Id);
            b.HasOne(t => t.InitiatingTeam)
             .WithMany()
             .HasForeignKey(t => t.InitiatingTeamId)
             .OnDelete(DeleteBehavior.Restrict);
            b.HasOne(t => t.ReceivingTeam)
             .WithMany()
             .HasForeignKey(t => t.ReceivingTeamId)
             .OnDelete(DeleteBehavior.Restrict);
            b.HasOne(t => t.League)
             .WithMany()
             .HasForeignKey(t => t.LeagueId)
             .OnDelete(DeleteBehavior.Cascade);
            b.HasIndex(t => t.LeagueId);
            b.HasIndex(t => new { t.InitiatingTeamId, t.Status });
            b.HasIndex(t => new { t.ReceivingTeamId, t.Status });
        });

        modelBuilder.Entity<Notification>(b =>
        {
            b.HasKey(n => n.Id);
            b.HasIndex(n => n.UserId);
        });

        modelBuilder.Entity<TradeItem>(b =>
        {
            b.HasKey(ti => ti.Id);
            b.HasOne(ti => ti.Trade)
             .WithMany(t => t.Items)
             .HasForeignKey(ti => ti.TradeId)
             .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(ti => ti.OfferingTeam)
             .WithMany()
             .HasForeignKey(ti => ti.OfferingTeamId)
             .OnDelete(DeleteBehavior.Restrict);
            b.HasOne(ti => ti.Player)
             .WithMany()
             .HasForeignKey(ti => ti.PlayerId)
             .OnDelete(DeleteBehavior.Restrict);
        });
    }
}