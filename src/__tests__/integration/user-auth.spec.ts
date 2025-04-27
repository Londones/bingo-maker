import { authTest, expect } from "./auth-setup";
import { createBingo } from "./helpers";

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
  }); // Test the migration feature specifically
  authTest("user can migrate anonymous bingos after login", async ({ anonymousPage }) => {
    // First create an anonymous bingo while anonymous
    const { bingoId, title } = await createBingo(anonymousPage);

    // Verify bingo was created and authorToken exists
    const authorToken = await anonymousPage.evaluate(() => localStorage.getItem("bingoAuthorToken"));
    expect(authorToken).toBeTruthy();

    // Check that the bingoId was stored in ownedBingos by the useSaveBingo hook
    const ownedBingos = await anonymousPage.evaluate(() => {
      const ownedBingosIds = localStorage.getItem("ownedBingos");
      return ownedBingosIds ? (JSON.parse(ownedBingosIds) as string[]) : [];
    });
    expect(ownedBingos).toContain(bingoId);

    // Sign up with a new account in the same context
    const email = `migrate-test-${Date.now()}@example.com`;
    const username = `migrate-user-${Date.now()}`;
    const password = "Test@123456";

    await anonymousPage.goto("/signup");
    await anonymousPage.getByLabel("Email").fill(email);
    await anonymousPage.getByLabel("Username").fill(username);
    await anonymousPage.getByLabel("Password").fill(password);
    await anonymousPage.getByRole("button", { name: /register|sign up/i }).click();

    // Sign in - this should automatically trigger the migration flow
    // since we're using the same browser context that has the bingoAuthorToken
    // and ownedBingos in localStorage
    await anonymousPage.goto("/signin");
    await anonymousPage.getByLabel("Email").fill(email);
    await anonymousPage.getByLabel("Password").fill(password);
    await anonymousPage.getByRole("button", { name: /sign in/i }).click();

    // Wait for the success message banner that appears after migration
    await anonymousPage.waitForSelector("text=Successfully migrated", { timeout: 5000 });

    // Verify the migrated bingo is in the user's bingos list
    await expect(anonymousPage.getByText(title)).toBeVisible();
  });
  // Test the scenario where a user with an existing account creates a bingo anonymously and then signs back in
  authTest(
    "existing user can create anonymous bingos and migrate them when signing back in",
    async ({ anonymousPage }) => {
      // 1. First, create a new user account
      const email = `existing-user-${Date.now()}@example.com`;
      const username = `existing-user-${Date.now()}`;
      const password = "Test@123456";

      // Sign up
      await anonymousPage.goto("/signup");
      await anonymousPage.getByLabel("Email").fill(email);
      await anonymousPage.getByLabel("Username").fill(username);
      await anonymousPage.getByLabel("Password").fill(password);
      await anonymousPage.getByRole("button", { name: /register|sign up/i }).click();

      // Sign in
      await anonymousPage.goto("/signin");
      await anonymousPage.getByLabel("Email").fill(email);
      await anonymousPage.getByLabel("Password").fill(password);
      await anonymousPage.getByRole("button", { name: /sign in/i }).click();

      // Confirm we're logged in
      await anonymousPage.waitForSelector("text=My Bingos", { timeout: 5000 });

      // 2. Sign out
      await anonymousPage.getByRole("button", { name: /sign out/i }).click();

      // 3. Create a bingo anonymously
      const { bingoId, title } = await createBingo(anonymousPage);

      // Verify bingo was created and authorToken exists
      const authorToken = await anonymousPage.evaluate(() => localStorage.getItem("bingoAuthorToken"));
      expect(authorToken).toBeTruthy();
      // Check that the bingoId was stored in ownedBingos
      const ownedBingos = await anonymousPage.evaluate(() => {
        const ownedBingosJson = localStorage.getItem("ownedBingos");
        return ownedBingosJson ? (JSON.parse(ownedBingosJson) as string[]) : [];
      });
      expect(ownedBingos).toContain(bingoId);

      // 4. Sign back in with existing account
      await anonymousPage.goto("/signin");
      await anonymousPage.getByLabel("Email").fill(email);
      await anonymousPage.getByLabel("Password").fill(password);
      await anonymousPage.getByRole("button", { name: /sign in/i }).click();

      // 5. Verify migration happened automatically
      // Wait for the success message banner that appears after migration
      await anonymousPage.waitForSelector("text=Successfully migrated", { timeout: 5000 });

      // Verify the migrated bingo is in the user's bingos list
      await expect(anonymousPage.getByText(title)).toBeVisible();
    }
  );
});
