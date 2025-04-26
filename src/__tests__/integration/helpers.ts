import { Page } from "@playwright/test";

export async function createAnonymousBingo(page: Page): Promise<string> {
  // Navigate to editor
  await page.goto("/editor");

  // Wait for editor to load
  await page.waitForSelector("text=New Bingo");

  // Add a title
  await page.getByRole("heading", { name: "New Bingo" }).dblclick();
  await page.keyboard.type(`Test Bingo Created Anonymously ${Date.now()}`);

  // Fill some cells
  const cells = await page.locator(".bingo-cell").all();
  for (let i = 0; i < Math.min(5, cells.length); i++) {
    await cells[i]?.click();
    await page.keyboard.type(`Cell ${i + 1}`);
    await page.keyboard.press("Escape");
  }

  // Save the bingo
  await page.getByTitle("Save").click();

  // Wait for save confirmation and get the URL
  await page.waitForSelector("text=Bingo saved successfully");

  // Extract bingo ID from URL
  const url = page.url();
  const bingoId = url.split("/").pop();

  return bingoId || "";
}

export async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/signin");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  // Wait for redirect to complete
  await page.waitForURL("/me");
}

export async function signUp(page: Page, email: string, username: string, password: string): Promise<void> {
  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign up" }).click();
  // Wait for redirect to complete
  await page.waitForURL("/signin");
}
