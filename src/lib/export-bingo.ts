"use client";

export async function exportBoardToPng(element: HTMLElement, title?: string): Promise<void> {
  const { domToPng } = await import("modern-screenshot");

  const dataUrl = await domToPng(element, {
    scale: 2,
    fetch: {
      requestInit: {
        mode: "cors",
      },
    },
  });

  const safeName =
    (title || "bingo")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "bingo";

  const link = document.createElement("a");
  link.download = `${safeName}.png`;
  link.href = dataUrl;
  link.click();
}
