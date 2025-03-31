import React from "react";

// Mock Button component
export const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: string;
}> = ({ children, onClick, variant }) => (
  <button onClick={onClick} data-variant={variant} data-testid="mock-button">
    {children}
  </button>
);

// Mock Input component
export const Input: React.FC<{
  type?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ type, onChange }) => <input type={type} onChange={onChange} data-testid="mock-input" />;

// Mock Label component
export const Label: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => <label data-testid="mock-label">{children}</label>;

// Mock Slider component
export const Slider: React.FC<{
  value?: number[];
  min?: number;
  max?: number;
  onValueChange?: (value: number[]) => void;
}> = ({ value, min, max, onValueChange }) => (
  <div data-testid="mock-slider" data-min={min} data-max={max}>
    <input
      type="range"
      value={value?.[0]}
      min={min}
      max={max}
      role="slider"
      onChange={(e) => onValueChange?.([parseInt(e.target.value)])}
    />
    <div className="value">{value?.[0]}</div>
  </div>
);

// Mock Tabs components
export const Tabs: React.FC<{
  defaultValue?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ defaultValue, children, className }) => (
  <div data-testid="mock-tabs" data-default-value={defaultValue} className={className}>
    {children}
  </div>
);

export const TabsList: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div data-testid="mock-tabs-list" className={className} role="tablist">
    {children}
  </div>
);

export const TabsTrigger: React.FC<{
  value: string;
  children: React.ReactNode;
  className?: string;
}> = ({ value, children, className }) => (
  <button data-testid="mock-tabs-trigger" data-value={value} className={className} role="tab">
    {children}
  </button>
);

export const TabsContent: React.FC<{
  value: string;
  children: React.ReactNode;
}> = ({ value, children }) => (
  <div
    data-testid="mock-tabs-content"
    data-value={value}
    role="tabpanel"
    data-state={value === "gradient" ? "active" : "inactive"}
    style={{ display: value === "gradient" ? "block" : "none" }}
  >
    {children}
  </div>
);
