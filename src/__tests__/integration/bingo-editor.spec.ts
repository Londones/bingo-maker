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

      // Step 2: Navigate to the /me page and click on the created bingo
      await authenticatedPage.goto("/me");
      await authenticatedPage.getByText(testTitle).click();

      // Step 3: Navigate to the editor page again
      await authenticatedPage.goto("/editor");

      // Step 4: Verify that the bingo is the initial bingo
      const editorTitle = await authenticatedPage.getByRole("heading", { name: "New Bingo" }).textContent();
      expect(editorTitle).toBe("New Bingo"); // Expect the title to be "New Bingo"
    }
  );

  authTest(
    "creating a bingo while logged in without saving, navigating to the /me page, clicking on the created bingo then navigating to the editor page should show the bingo that wasn't saved",
    async ({ authenticatedPage }) => {
      // Step 1: Create a bingo while logged in
      const { bingoId } = await createBingo(authenticatedPage);
      expect(bingoId).toBeTruthy();

      // Step 1: Create a bingo while logged in without saving
      await authenticatedPage.goto("/editor");
      const testTitle = `Bingo WIP`;
      await authenticatedPage.getByRole("heading", { name: "New Bingo" }).dblclick();
      await authenticatedPage.keyboard.type(testTitle);
      await authenticatedPage.keyboard.press("Escape"); // Close the editor without saving

      // Step 2: Navigate to the /me page and click on the created bingo
      await authenticatedPage.goto("/me");
      await authenticatedPage.getByText("Test Bingo Created").click();

      // Step 3: Navigate to the editor page again
      await authenticatedPage.goto("/editor");

      // Step 4: Verify that the bingo is the initial bingo
      const editorTitle = await authenticatedPage.getByRole("heading", { name: "Bingo WIP" }).textContent();
      expect(editorTitle).toBe("Bingo WIP"); // Expect the title to be "New Bingo"
    }
  );
});
