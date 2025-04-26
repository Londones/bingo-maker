import { authTest, expect } from "@/__tests__/integration/auth-setup";
import { createAnonymousBingo, signIn, signUp } from "@/__tests__/integration/helpers";

authTest.describe("Authentication and Bingo Migration", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testUsername = `testuser-${Date.now()}`;
  const testPassword = "Test@123456";

  authTest("can create bingo anonymously then migrate it after sign in", async ({ page, browser }) => {
    // Step 1: Create a bingo anonymously
    const bingoId = await createAnonymousBingo(page);
    expect(bingoId).toBeTruthy();

    // Store the authorToken from local storage
    const localStorageData = await page.evaluate(() => {
      return localStorage.getItem("bingoAuthorToken");
    });
    expect(localStorageData).toBeTruthy();

    // Step 2: Sign up as a new user
    await signUp(page, testEmail, testUsername, testPassword);

    // Step 3: Sign in as the new user
    await signIn(page, testEmail, testPassword);

    // Step 4: Check if the migration toast appears and click it
    await page.waitForSelector("text=Do you want to migrate your anonymous bingos?");
    await page.getByRole("button", { name: "Migrate now" }).click();

    // Step 5: Verify the migration was successful
    await page.waitForSelector("text=Successfully migrated");

    // Step 6: Go to "My Bingos" page and check if the migrated bingo is there
    await page.goto("/me");
    await expect(page.getByText("Test Bingo Created Anonymously")).toBeVisible();
  });
});
