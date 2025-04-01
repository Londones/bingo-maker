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

// Mock context menu components
export const ContextMenuSub: React.FC<{
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}> = ({ children, open, onOpenChange }) => (
  <div data-testid="mock-context-menu-sub" data-open={open} onClick={() => onOpenChange?.(!open)}>
    {children}
  </div>
);

export const ContextMenuSubTrigger: React.FC<{
  children: React.ReactNode;
  inset?: boolean;
  disabled?: boolean;
}> = ({ children, inset, disabled }) => (
  <button data-testid="mock-context-menu-sub-trigger" data-inset={inset} disabled={disabled}>
    {children}
  </button>
);

export const ContextMenuSubContent: React.FC<{
  children: React.ReactNode;
  className?: string;
  alignOffset?: number;
  avoidCollisions?: boolean;
}> = ({ children, className, alignOffset, avoidCollisions }) => (
  <div
    data-testid="mock-context-menu-sub-content"
    className={className}
    data-align-offset={alignOffset}
    data-avoid-collisions={avoidCollisions}
  >
    {children}
  </div>
);

// Mock RadioGroup components
export const RadioGroup: React.FC<{
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}> = ({ children, value, onValueChange, className }) => (
  <div data-testid="mock-radio-group" data-value={value} className={className}>
    {children}
    {/* Adding a mock trigger to simulate value changes during tests */}
    <button
      data-testid="mock-radio-trigger"
      style={{ display: "none" }}
      onClick={(e) => {
        const newValue = (e.currentTarget as HTMLElement).getAttribute("data-change-to");
        if (newValue && onValueChange) {
          onValueChange(newValue);
        }
      }}
    />
  </div>
);

export const RadioGroupItem: React.FC<{
  value: string;
  id?: string;
}> = ({ value, id }) => <input type="radio" value={value} id={id} data-testid={`mock-radio-group-item-${value}`} />;

// Mock Card component
export const Card: React.FC<{
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className, onClick }) => (
  <div data-testid="mock-card" data-classname={className} className={className} onClick={onClick}>
    {children}
  </div>
);

// Mock Popover components
export const Popover: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => <div data-testid="mock-popover">{children}</div>;

export const PopoverTrigger: React.FC<{
  children: React.ReactNode;
  asChild?: boolean;
}> = ({ children, asChild }) => (
  <div data-testid="mock-popover-trigger" data-as-child={asChild}>
    {children}
  </div>
);

export const PopoverContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div data-testid="mock-popover-content" className={className}>
    {children}
  </div>
);

// Mock Select components
export const Select: React.FC<{
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}> = ({ children, value, onValueChange, disabled }) => (
  <div
    data-testid="mock-select"
    data-value={value}
    data-disabled={disabled}
    onClick={() => {
      // This will be used in tests to simulate selection changes
    }}
  >
    {children}
    <input
      type="hidden"
      data-testid="mock-select-input"
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
    />
  </div>
);

export const SelectTrigger: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div data-testid="mock-select-trigger" className={className}>
    {children}
  </div>
);

export const SelectValue: React.FC<{
  children?: React.ReactNode;
}> = ({ children }) => <div data-testid="mock-select-value">{children}</div>;

export const SelectContent: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => <div data-testid="mock-select-content">{children}</div>;

export const SelectItem: React.FC<{
  children: React.ReactNode;
  value: string;
}> = ({ children, value }) => (
  <div
    data-testid={`mock-select-item-${value}`}
    data-value={value}
    onClick={(e) => {
      // Simulate selection by updating the hidden input
      const select = (e.target as HTMLElement).closest('[data-testid="mock-select"]');
      const input = select?.querySelector('[data-testid="mock-select-input"]') as HTMLInputElement;
      if (input) {
        input.value = value;
        const event = new Event("change", { bubbles: true });
        input.dispatchEvent(event);
      }
    }}
  >
    {children}
  </div>
);
