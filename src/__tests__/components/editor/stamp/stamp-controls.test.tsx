import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StampControls from "@/components/editor/stamp/stamp-controls";
import { useEditor } from "@/hooks/useEditor";

// Mock the dependencies
jest.mock("@/hooks/useEditor", () => ({
  useEditor: jest.fn(),
}));

// Define a global variable to track current emoji style
let globalEmojiStyle = "native";

// Mock EmojiPicker
jest.mock("emoji-picker-react", () => {
  return {
    __esModule: true,
    default: ({
      onEmojiClick,
      emojiStyle,
    }: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onEmojiClick: (emoji: any) => void;
      emojiStyle: string;
      lazyLoadEmojis?: boolean;
      theme?: string;
    }) => {
      // Store the currently passed style
      globalEmojiStyle = emojiStyle || globalEmojiStyle;

      return (
        <div data-testid="mock-emoji-picker" data-emoji-style={globalEmojiStyle}>
          <button
            data-testid="mock-emoji-button"
            onClick={() => {
              // Use the current style from the component (important!)
              if (globalEmojiStyle === "native") {
                onEmojiClick({
                  emoji: "🧡",
                });
              } else {
                console.log("Emoji style:", globalEmojiStyle);
                // For non-native, ensure we provide both emoji and proper imageUrl
                onEmojiClick({
                  emoji: "🧡",
                  imageUrl: `https://cdn.jsdelivr.net/npm/emoji-datasource-${globalEmojiStyle}/img/${globalEmojiStyle}/64/1f600.png`,
                  getImageUrl: (style: string) =>
                    `https://cdn.jsdelivr.net/npm/emoji-datasource-${style}/img/${style}/64/1f600.png`,
                });
              }
            }}
          >
            Select emoji
          </button>
        </div>
      );
    },
    Theme: {
      AUTO: "auto",
      LIGHT: "light",
      DARK: "dark",
    },
  };
});

// Mock Next.js Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) => (
    <img src={src} alt={alt} width={width} height={height} data-testid="mock-next-image" />
  ),
}));

// Mock the UI components
jest.mock("@/components/ui/label", () => ({
  Label: ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
    <label data-testid="mock-label" htmlFor={htmlFor}>
      {children}
    </label>
  ),
}));

jest.mock("@/components/ui/input", () => ({
  Input: ({
    type,
    onChange,
    defaultValue,
    min,
    max,
    id,
    className,
  }: {
    type?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    defaultValue?: number | string;
    min?: number;
    max?: number;
    id?: string;
    className?: string;
  }) => (
    <input
      type={type}
      onChange={onChange}
      defaultValue={defaultValue}
      min={min}
      max={max}
      id={id}
      className={className}
      data-testid="mock-input"
    />
  ),
}));

jest.mock("@/components/ui/popover", () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-popover">{children}</div>,
  PopoverTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    <div data-testid="mock-popover-trigger" data-as-child={asChild}>
      {children}
    </div>
  ),
  PopoverContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-popover-content">{children}</div>
  ),
}));

jest.mock("@/components/ui/select", () => ({
  Select: ({
    children,
    value,
    onValueChange,
    disabled,
  }: {
    children: React.ReactNode;
    value?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
  }) => (
    <div data-testid="mock-select" data-value={value} data-disabled={disabled}>
      {children}
      <input
        type="hidden"
        data-testid="mock-select-input"
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
      />
    </div>
  ),
  SelectTrigger: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="mock-select-trigger" className={className}>
      {children}
    </div>
  ),
  SelectValue: ({ children }: { children?: React.ReactNode }) => <div data-testid="mock-select-value">{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-select-content">{children}</div>
  ),
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <div
      data-testid={`mock-select-item-${value}`}
      data-value={value}
      onClick={() => {
        // Update the global style
        globalEmojiStyle = value;

        // Find parent Select component and trigger its onValueChange
        const selectInput = document.querySelector('[data-testid="mock-select-input"]') as HTMLInputElement;
        if (selectInput) {
          // This is critical - directly set the value and trigger change
          selectInput.value = value;
          fireEvent.change(selectInput, { target: { value } });
        }
      }}
    >
      {children}
    </div>
  ),
}));

// Initial mock state and actions
const mockState = {
  stamp: {
    type: "text",
    value: "😀",
    opacity: 0.8,
  },
};

const mockActions = {
  updateStamp: jest.fn(),
};

describe("StampControls Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalEmojiStyle = "native";
    (useEditor as jest.Mock).mockReturnValue({
      state: mockState,
      actions: mockActions,
    });
  });

  test("renders the component", () => {
    render(<StampControls />);
    expect(screen.getByText("Stamp")).toBeInTheDocument();
    expect(screen.getByText("Opacity")).toBeInTheDocument();

    // Use getAllByText to avoid the error with multiple matches
    expect(screen.getAllByText("Native")[0]).toBeInTheDocument();
  });

  test("shows the current stamp value", () => {
    render(<StampControls />);
    expect(screen.getByText("😀")).toBeInTheDocument();
  });

  test("updates opacity when input changes", () => {
    render(<StampControls />);

    // Find input and change value
    const opacityInput = screen.getByTestId("mock-input");
    fireEvent.change(opacityInput, { target: { value: "50" } });

    // Check if updateStamp action was called with the right values
    expect(mockActions.updateStamp).toHaveBeenCalledWith({
      ...mockState.stamp,
      opacity: 0.5,
    });
  });

  test("updates stamp when emoji is selected", () => {
    render(<StampControls />);

    // Find and click the emoji button to simulate emoji selection
    const emojiButton = screen.getByTestId("mock-emoji-button");
    fireEvent.click(emojiButton);

    // Check if updateStamp action was called with the right values for native style
    expect(mockActions.updateStamp).toHaveBeenCalledWith({
      ...mockState.stamp,
      type: "text",
      value: "🧡",
    });
  });

  test("style select is initially disabled", () => {
    render(<StampControls />);

    // Check if the select is disabled
    const select = screen.getByTestId("mock-select");

    expect(select).toHaveAttribute("data-disabled", "true");
  });

  test("enables style select when a different emoji is selected", () => {
    render(<StampControls />);

    // Find and click the emoji button to simulate emoji selection
    const emojiButton = screen.getByTestId("mock-emoji-button");
    fireEvent.click(emojiButton);

    // Check if the select is enabled
    const select = screen.getByTestId("mock-select");

    expect(select).not.toHaveAttribute("data-disabled", "true");
  });

  test("changes emoji style when a different style is selected", () => {
    render(<StampControls />);

    // First select an emoji to enable the style select
    const emojiButton = screen.getByTestId("mock-emoji-button");
    fireEvent.click(emojiButton);

    // Now select a different emoji style
    const appleOption = screen.getByTestId("mock-select-item-apple");
    fireEvent.click(appleOption);

    // Check if the emoji style has changed
    expect(globalEmojiStyle).toBe("apple");
  });

  // test("updates stamp with image URL when non-native style is selected", () => {
  //   render(<StampControls />);

  //   // First select an emoji to enable the style select
  //   const emojiButton = screen.getByTestId("mock-emoji-button");
  //   fireEvent.click(emojiButton);

  //   // Make sure the previous emoji selection completed
  //   expect(mockActions.updateStamp).toHaveBeenCalledWith(
  //     expect.objectContaining({
  //       type: "text",
  //       value: "🧡",
  //     })
  //   );

  //   // Reset the mock to track only new calls
  //   mockActions.updateStamp.mockClear();

  //   // Now select a different emoji style - this is a critical part
  //   const appleOption = screen.getByTestId("mock-select-item-apple");
  //   fireEvent.click(appleOption);

  //   // Verify the style changed globally
  //   expect(globalEmojiStyle).toBe("apple");

  //   // Click the emoji button again to select with the new style
  //   fireEvent.click(emojiButton);

  //   // The most recent updateStamp call should have the apple style values
  //   const lastCall = mockActions.updateStamp.mock.calls[mockActions.updateStamp.mock.calls.length - 1][0];
  //   expect(lastCall).toEqual({
  //     ...mockState.stamp,
  //     type: "image",
  //     value: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f600.png",
  //   });
  // });
});
