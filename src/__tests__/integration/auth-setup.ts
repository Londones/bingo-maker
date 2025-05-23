import { test as baseTest, Page } from "@playwright/test";
import { signIn, signUp } from "./helpers";
import path from "path";
import fs from "fs";

// Define storage state paths
const authenticatedUserFile = path.join(__dirname, "user.json");
const anonymousUserFile = path.join(__dirname, "anonymous-user.json");

type CustomFixtures = {
  authenticatedPage: Page;
  anonymousPage: Page;
};

// Create a fixture test that logs in and saves authentication state
export const authTest = baseTest.extend<CustomFixtures>({
  // Define a new fixture for authenticated context
  authenticatedPage: async ({ browser }, testHandler) => {
    // Create a new context with storage state if it exists
    const context = await browser.newContext({
      storageState: fs.existsSync(authenticatedUserFile) ? authenticatedUserFile : undefined,
    });

    // Disable tutorial for tests by marking it as already shown
    await context.addInitScript(() => {
      localStorage.setItem("bingo-maker-tutorial-shown", "true");
    });

    const page = await context.newPage();

    // Check if we need to log in (if auth state was not saved or expired)
    try {
      await page.goto("/me");
      // Quick check if we're already logged in
      const isLoggedIn = await page
        .getByText(/sign out|my bingos/i)
        .isVisible()
        .catch(() => false);

      if (!isLoggedIn) {
        // Not logged in or state expired - perform login
        const email = `test-${Date.now()}@example.com`;
        const username = `testuser-${Date.now()}`;
        const password = "Test@123456";

        // Sign up and sign in
        await signUp(page, email, username, password);
        await signIn(page, email, password);

        // Save storage state to reuse
        await context.storageState({ path: authenticatedUserFile });
      }
    } catch (error) {
      console.log("Error in auth setup:", error);
    }

    // Pass the authenticated page to the test
    await testHandler(page);

    // Close the context after test
    await context.close();
  },
  // Define a fixture for a context with anonymous auth token
  anonymousPage: async ({ browser }, testHandler) => {
    // Create a new context with storage state if it exists
    const context = await browser.newContext({
      storageState: fs.existsSync(anonymousUserFile) ? anonymousUserFile : undefined,
    });

    // Disable tutorial for tests by marking it as already shown
    await context.addInitScript(() => {
      localStorage.setItem("bingo-maker-tutorial-shown", "true");
    });

    const page = await context.newPage();

    // Pass the page to the test
    await testHandler(page);

    // Close the context after test
    await context.close();
  },
});

// Export all the fixtures from baseTest too
export { expect } from "@playwright/test";
