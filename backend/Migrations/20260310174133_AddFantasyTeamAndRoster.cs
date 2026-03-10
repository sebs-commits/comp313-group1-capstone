using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddFantasyTeamAndRoster : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_nba_leagues_CreatedByUserId",
                table: "nba_leagues");

            migrationBuilder.AddColumn<bool>(
                name: "UniqueRosters",
                table: "nba_leagues",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "fantasy_teams",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LeagueId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TeamName = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fantasy_teams", x => x.Id);
                    table.ForeignKey(
                        name: "FK_fantasy_teams_nba_leagues_LeagueId",
                        column: x => x.LeagueId,
                        principalTable: "nba_leagues",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "fantasy_rosters",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FantasyTeamId = table.Column<int>(type: "integer", nullable: false),
                    PlayerId = table.Column<int>(type: "integer", nullable: false),
                    AddedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fantasy_rosters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_fantasy_rosters_fantasy_teams_FantasyTeamId",
                        column: x => x.FantasyTeamId,
                        principalTable: "fantasy_teams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_fantasy_rosters_nba_players_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "nba_players",
                        principalColumn: "player_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_fantasy_rosters_FantasyTeamId",
                table: "fantasy_rosters",
                column: "FantasyTeamId");

            migrationBuilder.CreateIndex(
                name: "IX_fantasy_rosters_PlayerId",
                table: "fantasy_rosters",
                column: "PlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_fantasy_teams_LeagueId_UserId",
                table: "fantasy_teams",
                columns: new[] { "LeagueId", "UserId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "fantasy_rosters");

            migrationBuilder.DropTable(
                name: "fantasy_teams");

            migrationBuilder.DropColumn(
                name: "UniqueRosters",
                table: "nba_leagues");

            migrationBuilder.CreateIndex(
                name: "IX_nba_leagues_CreatedByUserId",
                table: "nba_leagues",
                column: "CreatedByUserId");
        }
    }
}
