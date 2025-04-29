import { authTest, expect } from "./auth-setup";
import { createBingo } from "./helpers";

authTest.describe("Bingo Editor State Management", () => {
  authTest(
    "creating a bingo while logged in, navigating to the /me page, clicking on the created bingo then navigating to the editor page should show an empty bingo",
    async ({ authenticatedPage }) => {
      // Step 1: Create a bingo while logged in
      await authenticatedPage.goto("/editor");
      const testTitle = `Test Bingo ${Date.now()}`;
      await authenticatedPage.getByRole("heading", { name: "New Bingo" }).dblclick();
      await authenticatedPage.keyboard.type(testTitle);
      await authenticatedPage.getByRole("button", { name: "Save" }).click();
      await authenticatedPage.waitForSelector("text=Bingo saved successfully");

      // Step 2: Navigate to the /me page and click on the created bingo
      await authenticatedPage.goto("/me");
      await authenticatedPage.waitForTimeout(1000); // Wait for the page to load
      await authenticatedPage.getByText(testTitle).click(); // Step 3: Navigate to the editor page again with additional options to handle navigation issues
      try {
        // Use waitUntil: 'domcontentloaded' instead of 'load' to prevent NS_BINDING_ABORTED issues
        await authenticatedPage.goto("/editor", {
          waitUntil: "domcontentloaded",
          timeout: 10000, // Increase timeout to 10 seconds
        });
      } catch (error) {
        console.log("Navigation error:", error);
        // If navigation fails, try again with a different approach
        await authenticatedPage.evaluate(() => {
          window.location.href = "/editor";
        });
        await authenticatedPage.waitForLoadState("domcontentloaded");
      }

      // Add a short wait to ensure the page is stable
      await authenticatedPage.waitForTimeout(1000);

      // Step 4: Verify that the bingo is the initial bingo
      await authenticatedPage.waitForSelector("text=New Bingo", { state: "visible", timeout: 5000 });
      const editorTitle = await authenticatedPage.getByRole("heading", { name: "New Bingo" }).textContent();
      expect(editorTitle).toBe("New Bingo"); // Expect the title to be "New Bingo"
    }
  );

  authTest(
    "creating a bingo while logged in without saving, navigating to the /me page, clicking on the WIP bingo then navigating to the editor page should show the bingo that wasn't saved",
    async ({ authenticatedPage }) => {
      // Step 1: Create a bingo while logged in without saving
      await authenticatedPage.goto("/editor");
      const testTitle = `New Bingo WIP ${Date.now()}`; // Add timestamp for uniqueness

      // Make sure the page is fully loaded before trying to edit
      await authenticatedPage.waitForSelector("text=New Bingo", { state: "visible" });

      // Edit title using better selector and more explicit steps
      const titleHeading = authenticatedPage.getByRole("heading", { name: "New Bingo" });
      await titleHeading.dblclick();
      await authenticatedPage.keyboard.press("Control+A");
      await authenticatedPage.keyboard.type(testTitle);

      // Make sure changes are registered
      await authenticatedPage.keyboard.press("Tab"); // Move focus to ensure change is registered
      await authenticatedPage.waitForTimeout(500); // Short pause for state to update

      // Step 2: Navigate to the /me page
      await authenticatedPage.getByRole("button", { name: "Profile" }).click();
      await authenticatedPage.waitForURL("**/me");

      // Verify that the WIP bingo is listed
      await expect(authenticatedPage.getByText(testTitle)).toBeVisible();

      // Click on the WIP bingo
      await authenticatedPage.getByText(testTitle).click();

      await authenticatedPage.waitForTimeout(1000); // Additional wait for any async state restoration

      // Step 4: Verify that the bingo is the WIP bingo - use more specific selector
      const titleSelector = authenticatedPage.getByRole("heading", { name: testTitle });
      await expect(titleSelector).toHaveText(testTitle);
    }
  );
});
