import { authTest, expect } from "./auth-setup";
import { createAnonymousBingo, signIn, signUp } from "./helpers";

authTest.describe("Bingo Permissions", () => {
  // For permissions tests, we need to work with two separate users
  // So we'll use the browser fixture to create separate contexts

  authTest(
    "different user gets redirected from editor to view when accessing someone else's bingo",
    async ({ authenticatedPage, browser }) => {
      // First user (authenticatedPage) is already logged in via our fixture

      // Create a bingo as the first user
      const bingoId = await createAnonymousBingo(authenticatedPage);
      expect(bingoId).toBeTruthy();

      // Create a second user in a separate context
      const userB = {
        email: `user-b-${Date.now()}@example.com`,
        username: `user-b-${Date.now()}`,
        password: "UserB@123456",
      };

      const contextB = await browser.newContext();
      const pageB = await contextB.newPage();

      // Set up second user
      await signUp(pageB, userB.email, userB.username, userB.password);
      await signIn(pageB, userB.email, userB.password);

      // Try to access the first user's bingo in editor mode
      await pageB.goto(`/editor/${bingoId}`);

      // Should be redirected to bingo view page
      await pageB.waitForURL(`/bingo/${bingoId}`);

      // Verify that the edit button is not present for User B
      await expect(pageB.getByRole("button", { name: "Edit" })).not.toBeVisible();

      // Clean up
      await contextB.close();
    }
  );

  authTest(
    "no edit button present for bingos that do not belong to current user",
    async ({ authenticatedPage, browser }) => {
      // First user (authenticatedPage) is already logged in via our fixture

      // Create a bingo as the first user
      const bingoId = await createAnonymousBingo(authenticatedPage);
      expect(bingoId).toBeTruthy();

      // User A should see edit button
      await authenticatedPage.goto(`/bingo/${bingoId}`);
      await expect(authenticatedPage.getByRole("button", { name: "Edit" })).toBeVisible();

      // Create a second user in a separate context
      const userB = {
        email: `user-b-${Date.now()}@example.com`,
        username: `user-b-${Date.now()}`,
        password: "UserB@123456",
      };

      const contextB = await browser.newContext();
      const pageB = await contextB.newPage();

      // Set up second user
      await signUp(pageB, userB.email, userB.username, userB.password);
      await signIn(pageB, userB.email, userB.password);

      // Access the first user's bingo in view mode
      await pageB.goto(`/bingo/${bingoId}`);

      // Verify that the edit button is not present for User B
      await expect(pageB.getByRole("button", { name: "Edit" })).not.toBeVisible();

      // Clean up
      await contextB.close();
    }
  );
});
