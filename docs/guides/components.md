# Component Guidelines

This guide covers the best practices for using and extending the `animate-ui` component library, with a focus on smooth animations and robust event handling.

## Animated Highlights

The `Highlight` and `HighlightItem` primitives provide the "sliding background" effect seen in the sidebar and dropdowns.

### Architectural Patterns

When adding animations to interactive components (especially Radix UI primitives), follow these rules to avoid click interception issues.

#### 1. Use "Parent Mode" for Lists
In "Parent Mode", the `Highlight` container manages a single animated background that moves between items. This is the safest pattern for complex interactive items (like checkboxes or radio buttons) because it moves the absolute-positioned motion div out of the individual items.

**When to use:**
- Dropdown menus with checkboxes or inputs.
- Sidebars with nested interactive elements.
- Navigation menus.

**Pattern:**
```tsx
<Highlight mode="parent" ...>
  <HighlightItem asChild>
    <MenuItem>Item 1</MenuItem>
  </HighlightItem>
  <HighlightItem asChild>
    <MenuItem>Item 2</MenuItem>
  </HighlightItem>
</Highlight>
```

#### 2. Avoid Wrappers on Complex Inputs
If an item has internal interactive regions (like a Radix `CheckboxItem` which has an `Indicator`), do NOT wrap it in a `HighlightItem` if using `mode="children"` or `mode="item"`. The wrapper's internal state or children could interfere with the input's hit box.

In these cases, either use **Parent Mode** or use standard CSS hover states:
```tsx
// Inside DropdownMenuCheckboxItem
<DropdownMenuCheckboxItemPrimitive
   className="focus:bg-sidebar-accent data-highlighted:bg-sidebar-accent ..."
>
  ...
</DropdownMenuCheckboxItemPrimitive>
```

#### 3. Use `asChild` Correctly
Always use the `asChild` prop from Radix UI when composing animation wrappers with interactive primitives. This ensures that the component remains a single DOM element, preserving Radix's event delegation and keyboard navigation.

## Component Organization

- `web/src/components/ui/`: Standard shadcn/ui primitives.
- `web/src/components/animate-ui/`: High-performance animated versions of primitives.
- `web/src/components/custom/`: Complex, multi-part component systems (e.g., Sidebar, DataTable sub-parts).
- `web/src/components/`: Specific app implementations (e.g., `NavUser`, `LoginForm`).
