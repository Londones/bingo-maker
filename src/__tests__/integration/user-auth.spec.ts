import { authTest, expect } from "./auth-setup";
import { createAnonymousBingo } from "./helpers";

authTest.describe("User Authentication Features", () => {
  authTest("user can create and save a bingo while logged in", async ({ authenticatedPage }) => {
    // Navigate to editor as an authenticated user
    await authenticatedPage.goto("/editor");

    // Add a title
    const testTitle = `Test Logged In Bingo ${Date.now()}`;
    await authenticatedPage.getByRole("heading", { name: "New Bingo" }).dblclick();
    await authenticatedPage.keyboard.type(testTitle);

    // Fill a cell
    const cells = await authenticatedPage.locator("[data-testid*='bingo-cell']").all();
    await cells[0]?.click();
    await authenticatedPage.keyboard.type("Logged In Test Cell");
    await authenticatedPage.keyboard.press("Escape");

    // Save the bingo
    await authenticatedPage.getByRole("button", { name: "Save" }).click();

    // Verify it appears in "My Bingos"
    await authenticatedPage.goto("/me");
    await expect(authenticatedPage.getByText(testTitle)).toBeVisible();
  });

  // Test the migration feature specifically
  authTest("user can migrate anonymous bingos after login", async ({ anonymousPage, browser }) => {
    // First create an anonymous bingo
    const bingoId = await createAnonymousBingo(anonymousPage);

    // Store anonymous token
    const anonymousToken = await anonymousPage.evaluate(() => localStorage.getItem("bingoAuthorToken"));
    expect(anonymousToken).toBeTruthy();

    // Create a new context for a fresh login
    const newContext = await browser.newContext();
    const newPage = await newContext.newPage();

    // Sign up and login with a new account
    const email = `migrate-test-${Date.now()}@example.com`;
    const username = `migrate-user-${Date.now()}`;
    const password = "Test@123456";

    await newPage.goto("/signup");
    await newPage.getByLabel("Email").fill(email);
    await newPage.getByLabel("Username").fill(username);
    await newPage.getByLabel("Password").fill(password);
    await newPage.getByRole("button", { name: /register|sign up/i }).click();

    // Sign in
    await newPage.goto("/signin");
    await newPage.getByLabel("Email").fill(email);
    await newPage.getByLabel("Password").fill(password);
    await newPage.getByRole("button", { name: /sign in|log in/i }).click();

    // Set the anonymous token in localStorage to simulate having created bingos anonymously
    await newPage.evaluate((token) => {
      localStorage.setItem("bingoAuthorToken", token);
    }, anonymousToken);

    // Go to home page to trigger migration toast
    await newPage.goto("/");

    // Check for migration toast and click it
    await newPage.waitForSelector("text=Do you want to migrate your anonymous bingos?");
    await newPage.getByRole("button", { name: "Migrate now" }).click();

    // Verify success message
    await newPage.waitForSelector("text=Successfully migrated");

    // Go to "My Bingos" and verify the migrated bingo is there
    await newPage.goto("/me");
    await expect(newPage.getByText("Test Bingo Created Anonymously")).toBeVisible();

    // Clean up
    await newContext.close();
  });
});
