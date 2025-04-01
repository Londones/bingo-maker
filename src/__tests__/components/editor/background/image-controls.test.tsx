import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEditor } from "@/hooks/useEditor";
import { convertFileToBase64 } from "@/lib/utils";
import ImageControls from "@/components/editor/background/image-controls";
import { Button, Input, Label, Slider } from "@/__mocks__/components/ui-components";

// Use mocks
jest.mock("@/hooks/useEditor");
jest.mock("@/lib/utils", () => ({
  convertFileToBase64: jest.fn().mockResolvedValue("data:image/jpeg;base64,mockBase64Data"),
}));
jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
  },
}));

// Mock the UI components to avoid cn error
jest.mock("@/components/ui/button", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Button: (props: any) => <Button {...props} />,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Input: (props: any) => <Input {...props} />,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Label: (props: any) => <Label {...props} />,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Slider: (props: any) => <Slider {...props} />,
}));

describe("ImageControls", () => {
  // Setup mock data and functions
  const mockUpdateBackground = jest.fn();
  const mockSetLocalImage = jest.fn();
  const mockRemoveLocalBackgroundImage = jest.fn();

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup default mock implementation
    (useEditor as jest.Mock).mockReturnValue({
      state: {
        background: {
          backgroundImage: "",
          backgroundImageOpacity: 100,
          backgroundImageSize: 100,
          backgroundImagePosition: "50% 50%",
        },
        localImages: [],
      },
      actions: {
        updateBackground: mockUpdateBackground,
        setLocalImage: mockSetLocalImage,
        removeLocalBackgroundImage: mockRemoveLocalBackgroundImage,
      },
    });

    // Mock getBoundingClientRect for containerRef
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 200,
      height: 100,
      left: 0,
      top: 0,
      right: 200,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));
  });

  test("renders file input when no background image is set", () => {
    render(<ImageControls />);
    expect(screen.getByTestId("mock-input")).toBeInTheDocument();
  });

  test("renders image controls when background image is set", () => {
    // Update mock to include background image
    (useEditor as jest.Mock).mockReturnValue({
      state: {
        background: {
          backgroundImage: "data:image/jpeg;base64,mockImageData",
          backgroundImageOpacity: 100,
          backgroundImageSize: 100,
          backgroundImagePosition: "50% 50%",
        },
        localImages: [],
      },
      actions: {
        updateBackground: mockUpdateBackground,
        setLocalImage: mockSetLocalImage,
        removeLocalBackgroundImage: mockRemoveLocalBackgroundImage,
      },
    });

    render(<ImageControls />);

    // Check for sliders
    const sliders = screen.getAllByTestId("mock-slider");
    expect(sliders).toHaveLength(2);

    // Check for remove button
    expect(screen.getByText("Remove Image")).toBeInTheDocument();
  });

  test("handles file selection", async () => {
    //const user = userEvent.setup();
    render(<ImageControls />);

    const fileInput = screen.getByTestId("mock-input");
    const file = new File(["dummy content"], "test-image.jpg", {
      type: "image/jpeg",
    });

    // Trigger the onChange event directly
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Wait for the async function to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(convertFileToBase64).toHaveBeenCalledWith(file);
    expect(mockSetLocalImage).toHaveBeenCalledWith({
      url: "data:image/jpeg;base64,mockBase64Data",
      type: "background",
      fileInfo: {
        name: "test-image.jpg",
        type: "image/jpeg",
        size: expect.any(Number),
      },
    });
  });

  test("handles removing image", async () => {
    // Setup mock with background image
    (useEditor as jest.Mock).mockReturnValue({
      state: {
        background: {
          backgroundImage: "data:image/jpeg;base64,mockImageData",
          backgroundImageOpacity: 100,
          backgroundImageSize: 100,
          backgroundImagePosition: "50% 50%",
        },
        localImages: [{ type: "background", url: "data:image/jpeg;base64,mockImageData" }],
      },
      actions: {
        updateBackground: mockUpdateBackground,
        setLocalImage: mockSetLocalImage,
        removeLocalBackgroundImage: mockRemoveLocalBackgroundImage,
      },
    });

    const user = userEvent.setup();
    render(<ImageControls />);

    const removeButton = screen.getByText("Remove Image");
    await user.click(removeButton);

    expect(mockUpdateBackground).toHaveBeenCalled();
    expect(mockRemoveLocalBackgroundImage).toHaveBeenCalled();
  });

  test("handles opacity slider change", () => {
    // Setup mock with background image
    (useEditor as jest.Mock).mockReturnValue({
      state: {
        background: {
          backgroundImage: "data:image/jpeg;base64,mockImageData",
          backgroundImageOpacity: 100,
          backgroundImageSize: 100,
          backgroundImagePosition: "50% 50%",
        },
        localImages: [],
      },
      actions: {
        updateBackground: mockUpdateBackground,
        setLocalImage: mockSetLocalImage,
        removeLocalBackgroundImage: mockRemoveLocalBackgroundImage,
      },
    });

    render(<ImageControls />);

    // Find the opacity slider and change its value
    const opacitySliders = screen.getAllByRole("slider");
    fireEvent.change(opacitySliders[0]!, { target: { value: 50 } });

    expect(mockUpdateBackground).toHaveBeenCalledWith(
      expect.objectContaining({
        backgroundImageOpacity: 50,
      })
    );
  });

  test("handles position change on image click", () => {
    // Setup mock with background image
    (useEditor as jest.Mock).mockReturnValue({
      state: {
        background: {
          backgroundImage: "data:image/jpeg;base64,mockImageData",
          backgroundImageOpacity: 100,
          backgroundImageSize: 100,
          backgroundImagePosition: "50% 50%",
        },
        localImages: [],
      },
      actions: {
        updateBackground: mockUpdateBackground,
        setLocalImage: mockSetLocalImage,
        removeLocalBackgroundImage: mockRemoveLocalBackgroundImage,
      },
    });

    const { container } = render(<ImageControls />);

    // Find the image container by class
    const imageContainer = container.querySelector(".relative.w-full.h-48.border.rounded-lg");
    expect(imageContainer).not.toBeNull();

    // Simulate click on the container
    fireEvent.click(imageContainer!, {
      clientX: 50, // 25% of width
      clientY: 25, // 25% of height
    });

    expect(mockUpdateBackground).toHaveBeenCalledWith(
      expect.objectContaining({
        backgroundImagePosition: expect.stringContaining("%"),
      })
    );
  });
});
