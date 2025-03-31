export const mockSession = {
  user: { id: "test-user-id", email: "test@example.com" },
};

export const auth = jest.fn(() => Promise.resolve(mockSession));
export const GoogleProvider = jest.fn();
