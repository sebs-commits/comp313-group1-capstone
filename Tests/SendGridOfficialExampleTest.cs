using Xunit;
using Xunit.Abstractions;
using SendGrid;
using SendGrid.Helpers.Mail;
using Microsoft.Extensions.Configuration;

namespace Tests;

public class SendGridOfficialExampleTests
{
	private readonly ITestOutputHelper _output;
	private readonly IConfiguration _configuration;

	public SendGridOfficialExampleTests(ITestOutputHelper output)
	{
		_output = output;
		_configuration = new ConfigurationBuilder()
			.SetBasePath(Directory.GetCurrentDirectory())
			.AddJsonFile("appsettings.json", optional: true)
			.Build();
	}

	[Fact]
	public async Task OfficialExample_SendEmail_ShouldReturnAccepted()
	{
		var apiKey = _configuration["SendGrid:ApiKey"];
		var verifiedEmail = _configuration["SendGrid:FromEmail"];

		var client = new SendGridClient(apiKey);

		var from = new EmailAddress(verifiedEmail, "NBA Fantasy App");
		var to = new EmailAddress(verifiedEmail, "Test User");

		var subject = "Sending with SendGrid is Fun";
		var plainTextContent = "and easy to do anywhere, even with C#";
		var htmlContent = "<strong>and easy to do anywhere, even with C#</strong>";

		var msg = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent, htmlContent);

		var response = await client.SendEmailAsync(msg);

		_output.WriteLine($"Status Code: {response.StatusCode}");

		if (!response.IsSuccessStatusCode)
		{
			var errorBody = await response.Body.ReadAsStringAsync();
			_output.WriteLine($"Error Detail: {errorBody}");
		}

		Assert.Equal(System.Net.HttpStatusCode.Accepted, response.StatusCode);
	}
}