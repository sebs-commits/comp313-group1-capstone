using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddDraftTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "draft_sessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LeagueId = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CurrentPick = table.Column<int>(type: "integer", nullable: false),
                    TotalPicks = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_draft_sessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_draft_sessions_nba_leagues_LeagueId",
                        column: x => x.LeagueId,
                        principalTable: "nba_leagues",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "draft_orders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DraftSessionId = table.Column<int>(type: "integer", nullable: false),
                    FantasyTeamId = table.Column<int>(type: "integer", nullable: false),
                    PickPosition = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_draft_orders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_draft_orders_draft_sessions_DraftSessionId",
                        column: x => x.DraftSessionId,
                        principalTable: "draft_sessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_draft_orders_fantasy_teams_FantasyTeamId",
                        column: x => x.FantasyTeamId,
                        principalTable: "fantasy_teams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "draft_picks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DraftSessionId = table.Column<int>(type: "integer", nullable: false),
                    FantasyTeamId = table.Column<int>(type: "integer", nullable: false),
                    PlayerId = table.Column<int>(type: "integer", nullable: false),
                    Round = table.Column<int>(type: "integer", nullable: false),
                    PickNumber = table.Column<int>(type: "integer", nullable: false),
                    PickedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_draft_picks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_draft_picks_draft_sessions_DraftSessionId",
                        column: x => x.DraftSessionId,
                        principalTable: "draft_sessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_draft_picks_fantasy_teams_FantasyTeamId",
                        column: x => x.FantasyTeamId,
                        principalTable: "fantasy_teams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_draft_picks_nba_players_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "nba_players",
                        principalColumn: "player_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_draft_orders_DraftSessionId",
                table: "draft_orders",
                column: "DraftSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_draft_orders_FantasyTeamId",
                table: "draft_orders",
                column: "FantasyTeamId");

            migrationBuilder.CreateIndex(
                name: "IX_draft_picks_DraftSessionId",
                table: "draft_picks",
                column: "DraftSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_draft_picks_FantasyTeamId",
                table: "draft_picks",
                column: "FantasyTeamId");

            migrationBuilder.CreateIndex(
                name: "IX_draft_picks_PlayerId",
                table: "draft_picks",
                column: "PlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_draft_sessions_LeagueId",
                table: "draft_sessions",
                column: "LeagueId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "draft_orders");

            migrationBuilder.DropTable(
                name: "draft_picks");

            migrationBuilder.DropTable(
                name: "draft_sessions");
        }
    }
}
