import { authTest, expect } from "./auth-setup";

authTest.describe("Bingo Editor State Management", () => {
  authTest(
    "going from editor/[id] to /editor sets state to the WIP bingo or creates a new one",
    async ({ anonymousPage: page }) => {
      // Create a new bingo
      await page.goto("/editor");
      await page.waitForSelector("text=New Bingo");

      // Add a title to identify this bingo
      const testTitle = `Test WIP Bingo ${Date.now()}`;
      await page.getByRole("button", { name: "New Bingo" }).dblclick();
      await page.keyboard.type(testTitle);

      // Fill a cell to make it unique
      const cells = await page.locator(".bingo-cell").all();
      await cells[0]?.click();
      await page.keyboard.type("Unique WIP cell");
      await page.keyboard.press("Escape");

      // Save URL for later when we want to return to this specific bingo
      const currentUrl = page.url();
      const bingoId = currentUrl.includes("/editor/") ? currentUrl.split("/").pop() : null;
      expect(bingoId).toBeTruthy();

      // Now go to the main editor page
      await page.goto("/editor");

      // Check if the WIP state was persisted (title should still be there)
      await expect(page.getByRole("textbox", { name: "Title" })).toHaveValue(testTitle);

      // Check if cell content was persisted
      await expect(page.locator(".bingo-cell").first()).toContainText("Unique WIP cell");

      // Clear editor by creating a new bingo
      await page.getByRole("button", { name: "New Bingo" }).click();
      await page.getByRole("button", { name: "Confirm" }).click();

      // Verify that we have a fresh state
      await expect(page.getByRole("textbox", { name: "Title" })).toHaveValue("");
      await expect(page.locator(".bingo-cell").first()).not.toContainText("Unique WIP cell");

      // Now navigate back to the specific bingo by ID
      await page.goto(`/editor/${bingoId}`);

      // Verify the correct bingo loaded
      await expect(page.getByRole("textbox", { name: "Title" })).toHaveValue(testTitle);
      await expect(page.locator(".bingo-cell").first()).toContainText("Unique WIP cell");
    }
  );
});
