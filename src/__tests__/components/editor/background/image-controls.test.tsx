import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import ImageControls from "@/components/editor/background/image-controls";
import { renderWithEditorStore } from "../../../../../jest/helpers/render-with-editor";
import { uploadImagesToBingo } from "@/lib/client-s3upload";

jest.mock("@/hooks/useIsAuth", () => ({
  useIsAuth: jest.fn(() => true),
}));

jest.mock("@/lib/client-s3upload", () => ({
  uploadImagesToBingo: jest.fn().mockResolvedValue([{ type: "background", url: "https://example.com/bg.jpg" }]),
}));

jest.mock("@/app/actions/delete-image", () => ({
  deleteImageFromS3: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe("ImageControls (real Redux store)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("uploads a background image and updates Redux store", async () => {
    const { store, container } = renderWithEditorStore(<ImageControls />);

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    const file = new File(["img"], "bg.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(uploadImagesToBingo).toHaveBeenCalled();
      expect(store.getState().editor.history.present.background.backgroundImage).toBe("https://example.com/bg.jpg");
    });
  });

  test("shows image controls when backgroundImage is already set", () => {
    const { container } = renderWithEditorStore(<ImageControls />, {
      background: {
        value: JSON.stringify({ backgroundColor: "#000", stops: [] }),
        backgroundImage: "https://example.com/existing.jpg",
        backgroundImageOpacity: 80,
        backgroundImageSize: 120,
        backgroundImagePosition: "50% 50%",
      },
    });

    expect(screen.getByText(/opacity/i)).toBeInTheDocument();
    expect(container.innerHTML).toContain("https://example.com/existing.jpg");
  });
});
