import { test, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/svelte";
import SidebarButton from "$lib/components/sidebar/sidebar-button.svelte";

test("SidebarButton: renders basic button without context menu", async () => {
  const mockClick = vi.fn();
  
  const { getByRole, getByText } = render(SidebarButton, {
    props: {
      icon: "📋",
      label: "Tasks",
      count: 5,
      isActive: false,
      onclick: mockClick
    }
  });
  
  const button = getByRole("button");
  expect(button).toBeTruthy();
  expect(getByText("📋")).toBeTruthy();
  expect(getByText("Tasks")).toBeTruthy();
  expect(getByText("5")).toBeTruthy();
});

test("SidebarButton: handles click events", async () => {
  const mockClick = vi.fn();
  
  const { getByRole } = render(SidebarButton, {
    props: {
      icon: "📋",
      label: "Tasks",
      count: 5,
      isActive: false,
      onclick: mockClick
    }
  });
  
  const button = getByRole("button");
  await fireEvent.click(button);
  
  expect(mockClick).toHaveBeenCalledTimes(1);
});

test("SidebarButton: applies active styling when isActive is true", async () => {
  const mockClick = vi.fn();
  
  const { getByRole } = render(SidebarButton, {
    props: {
      icon: "📋",
      label: "Tasks",
      count: 5,
      isActive: true,
      onclick: mockClick
    }
  });
  
  const button = getByRole("button");
  expect(button.className).toContain("bg-muted");
});

test("SidebarButton: applies ghost styling when isActive is false", async () => {
  const mockClick = vi.fn();
  
  const { getByRole } = render(SidebarButton, {
    props: {
      icon: "📋",
      label: "Tasks", 
      count: 5,
      isActive: false,
      onclick: mockClick
    }
  });
  
  const button = getByRole("button");
  expect(button.className).not.toContain("bg-muted");
});

test("SidebarButton: displays different count values", async () => {
  const mockClick = vi.fn();
  
  const { getByText, rerender } = render(SidebarButton, {
    props: {
      icon: "📋",
      label: "Tasks",
      count: 0,
      isActive: false,
      onclick: mockClick
    }
  });
  
  expect(getByText("0")).toBeTruthy();
  
  await rerender({
    icon: "📋",
    label: "Tasks",
    count: 99,
    isActive: false,
    onclick: mockClick
  });
  
  expect(getByText("99")).toBeTruthy();
});

test("SidebarButton: renders with context menu when contextMenuItems provided", async () => {
  const mockClick = vi.fn();
  const mockContextAction = vi.fn();
  
  const contextMenuItems = [
    {
      label: "Edit",
      action: mockContextAction
    }
  ];
  
  const { container } = render(SidebarButton, {
    props: {
      icon: "📋",
      label: "Tasks",
      count: 5,
      isActive: false,
      onclick: mockClick,
      contextMenuItems
    }
  });
  
  // When context menu items are provided, the component structure changes
  // The button should still be clickable
  const button = container.querySelector("button");
  expect(button).toBeTruthy();
  
  if (button) {
    await fireEvent.click(button);
    expect(mockClick).toHaveBeenCalledTimes(1);
  }
});