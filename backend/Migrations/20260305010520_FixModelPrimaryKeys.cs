using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class FixModelPrimaryKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TeamData",
                columns: table => new
                {
                    TeamId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TeamName = table.Column<string>(type: "text", nullable: false),
                    TeamCity = table.Column<string>(type: "text", nullable: false),
                    TeamTricode = table.Column<string>(type: "text", nullable: false),
                    Score = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeamData", x => x.TeamId);
                });

            migrationBuilder.CreateTable(
                name: "NbaGames",
                columns: table => new
                {
                    GameId = table.Column<string>(type: "text", nullable: false),
                    GameCode = table.Column<string>(type: "text", nullable: false),
                    GameStatus = table.Column<int>(type: "integer", nullable: false),
                    GameStatusText = table.Column<string>(type: "text", nullable: false),
                    Period = table.Column<int>(type: "integer", nullable: false),
                    HomeTeamTeamId = table.Column<int>(type: "integer", nullable: false),
                    AwayTeamTeamId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NbaGames", x => x.GameId);
                    table.ForeignKey(
                        name: "FK_NbaGames_TeamData_AwayTeamTeamId",
                        column: x => x.AwayTeamTeamId,
                        principalTable: "TeamData",
                        principalColumn: "TeamId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NbaGames_TeamData_HomeTeamTeamId",
                        column: x => x.HomeTeamTeamId,
                        principalTable: "TeamData",
                        principalColumn: "TeamId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_NbaGames_AwayTeamTeamId",
                table: "NbaGames",
                column: "AwayTeamTeamId");

            migrationBuilder.CreateIndex(
                name: "IX_NbaGames_HomeTeamTeamId",
                table: "NbaGames",
                column: "HomeTeamTeamId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NbaGames");

            migrationBuilder.DropTable(
                name: "TeamData");
        }
    }
}
