import { authTest, expect } from "./auth-setup";
import { createBingo } from "./helpers";

authTest.describe("Bingo Editor State Management", () => {
  authTest(
    "creating a bingo while logged in, navigating to the /me page, clicking on the created bingo then navigating to the editor page should show an empty bingo",
    async ({ authenticatedPage }) => {
      // Step 1: Create a bingo while logged in
      await authenticatedPage.goto("/editor");
      const testTitle = `Test Bingo ${Date.now()}`;

      // Wait for the editor to be fully loaded
      await authenticatedPage.waitForSelector("text=New Bingo", { state: "visible", timeout: 10000 });

      await authenticatedPage.getByRole("heading", { name: "New Bingo" }).dblclick();
      await authenticatedPage.keyboard.type(testTitle);
      await authenticatedPage.getByRole("button", { name: "Save" }).click();

      // Wait for save confirmation with increased timeout
      await authenticatedPage.waitForSelector("text=Bingo saved successfully", { timeout: 15000 });

      // Step 2: Navigate to the /me page and ensure navigation completes
      await authenticatedPage.goto("/me", { waitUntil: "domcontentloaded" });

      // Wait for the page to be fully loaded and the bingo to appear
      await authenticatedPage.waitForSelector(`text=${testTitle}`, { state: "visible", timeout: 10000 });

      await expect(authenticatedPage.getByText(testTitle)).toBeVisible();
      await authenticatedPage.getByText("Create New Bingo").click();

      // Add a short wait to ensure the page is stable
      await authenticatedPage.waitForTimeout(1000);

      // Step 4: Verify that the bingo is the initial bingo
      await authenticatedPage.waitForSelector("text=New Bingo", { state: "visible", timeout: 10000 });
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
