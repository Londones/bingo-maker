import "@testing-library/jest-dom";

// Mock browser APIs not available in JSDOM
global.ResizeObserver = class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock URL.createObjectURL which is used in image handling
global.URL.createObjectURL = jest.fn(() => "mock-url");
global.URL.revokeObjectURL = jest.fn();

// Common mocks for component tests
jest.mock("@/hooks/useEditor", () => ({
  useEditor: jest.fn(),
}));
