using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    public partial class RemoveProfileFKFromLeagueMembers : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""ALTER TABLE "LeagueMembers" DROP CONSTRAINT IF EXISTS "FK_LeagueMembers_profiles_UserId";""");
            migrationBuilder.Sql("""ALTER TABLE "LeagueMembers" DROP CONSTRAINT IF EXISTS "FK_LeagueMembers_Leagues_LeagueId";""");
            migrationBuilder.Sql("""ALTER TABLE "LeagueMembers" DROP CONSTRAINT IF EXISTS "FK_LeagueMembers_nba_leagues_LeagueId";""");
            migrationBuilder.Sql("""ALTER TABLE nba_leagues DROP CONSTRAINT IF EXISTS "FK_Leagues_profiles_CreatedByUserId";""");
            migrationBuilder.Sql("""ALTER TABLE nba_leagues DROP CONSTRAINT IF EXISTS "FK_nba_leagues_profiles_CreatedByUserId";""");

            migrationBuilder.Sql("""
                ALTER TABLE "LeagueMembers" ADD CONSTRAINT "FK_LeagueMembers_nba_leagues_LeagueId"
                    FOREIGN KEY ("LeagueId") REFERENCES nba_leagues ("Id") ON DELETE CASCADE;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
