using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class MigrationTest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "nba_teams",
                columns: table => new
                {
                    team_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    abbreviation = table.Column<string>(type: "text", nullable: true),
                    full_name = table.Column<string>(type: "text", nullable: true),
                    city = table.Column<string>(type: "text", nullable: true),
                    state = table.Column<string>(type: "text", nullable: true),
                    conference = table.Column<string>(type: "text", nullable: true),
                    division = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_nba_teams", x => x.team_id);
                });

            migrationBuilder.CreateTable(
                name: "nba_games",
                columns: table => new
                {
                    game_id = table.Column<string>(type: "text", nullable: false),
                    season = table.Column<string>(type: "text", nullable: true),
                    game_date = table.Column<DateOnly>(type: "date", nullable: true),
                    home_team_id = table.Column<int>(type: "integer", nullable: true),
                    away_team_id = table.Column<int>(type: "integer", nullable: true),
                    home_team_score = table.Column<int>(type: "integer", nullable: true),
                    away_team_score = table.Column<int>(type: "integer", nullable: true),
                    status = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_nba_games", x => x.game_id);
                    table.ForeignKey(
                        name: "FK_nba_games_nba_teams_away_team_id",
                        column: x => x.away_team_id,
                        principalTable: "nba_teams",
                        principalColumn: "team_id");
                    table.ForeignKey(
                        name: "FK_nba_games_nba_teams_home_team_id",
                        column: x => x.home_team_id,
                        principalTable: "nba_teams",
                        principalColumn: "team_id");
                });

            migrationBuilder.CreateTable(
                name: "nba_players",
                columns: table => new
                {
                    player_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    first_name = table.Column<string>(type: "text", nullable: true),
                    last_name = table.Column<string>(type: "text", nullable: true),
                    full_name = table.Column<string>(type: "text", nullable: true),
                    team_id = table.Column<int>(type: "integer", nullable: true),
                    position = table.Column<string>(type: "text", nullable: true),
                    jersey_number = table.Column<string>(type: "text", nullable: true),
                    height = table.Column<string>(type: "text", nullable: true),
                    weight = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_nba_players", x => x.player_id);
                    table.ForeignKey(
                        name: "FK_nba_players_nba_teams_team_id",
                        column: x => x.team_id,
                        principalTable: "nba_teams",
                        principalColumn: "team_id");
                });

            migrationBuilder.CreateTable(
                name: "nba_player_game_stats",
                columns: table => new
                {
                    stat_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    player_id = table.Column<int>(type: "integer", nullable: false),
                    game_id = table.Column<string>(type: "text", nullable: false),
                    team_id = table.Column<int>(type: "integer", nullable: true),
                    minutes = table.Column<string>(type: "text", nullable: true),
                    points = table.Column<int>(type: "integer", nullable: true),
                    rebounds = table.Column<int>(type: "integer", nullable: true),
                    assists = table.Column<int>(type: "integer", nullable: true),
                    steals = table.Column<int>(type: "integer", nullable: true),
                    blocks = table.Column<int>(type: "integer", nullable: true),
                    turnovers = table.Column<int>(type: "integer", nullable: true),
                    personal_fouls = table.Column<int>(type: "integer", nullable: true),
                    fg_made = table.Column<int>(type: "integer", nullable: true),
                    fg_attempted = table.Column<int>(type: "integer", nullable: true),
                    fg3_made = table.Column<int>(type: "integer", nullable: true),
                    fg3_attempted = table.Column<int>(type: "integer", nullable: true),
                    ft_made = table.Column<int>(type: "integer", nullable: true),
                    ft_attempted = table.Column<int>(type: "integer", nullable: true),
                    plus_minus = table.Column<decimal>(type: "numeric", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_nba_player_game_stats", x => x.stat_id);
                    table.ForeignKey(
                        name: "FK_nba_player_game_stats_nba_games_game_id",
                        column: x => x.game_id,
                        principalTable: "nba_games",
                        principalColumn: "game_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_nba_player_game_stats_nba_players_player_id",
                        column: x => x.player_id,
                        principalTable: "nba_players",
                        principalColumn: "player_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_nba_player_game_stats_nba_teams_team_id",
                        column: x => x.team_id,
                        principalTable: "nba_teams",
                        principalColumn: "team_id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_nba_games_away_team_id",
                table: "nba_games",
                column: "away_team_id");

            migrationBuilder.CreateIndex(
                name: "IX_nba_games_home_team_id",
                table: "nba_games",
                column: "home_team_id");

            migrationBuilder.CreateIndex(
                name: "IX_nba_player_game_stats_game_id",
                table: "nba_player_game_stats",
                column: "game_id");

            migrationBuilder.CreateIndex(
                name: "IX_nba_player_game_stats_player_id",
                table: "nba_player_game_stats",
                column: "player_id");

            migrationBuilder.CreateIndex(
                name: "IX_nba_player_game_stats_team_id",
                table: "nba_player_game_stats",
                column: "team_id");

            migrationBuilder.CreateIndex(
                name: "IX_nba_players_team_id",
                table: "nba_players",
                column: "team_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "nba_player_game_stats");

            migrationBuilder.DropTable(
                name: "nba_games");

            migrationBuilder.DropTable(
                name: "nba_players");

            migrationBuilder.DropTable(
                name: "nba_teams");
        }
    }
}
