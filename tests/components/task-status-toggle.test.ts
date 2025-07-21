import { test, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/svelte";
import TaskStatusToggle from "../../src/lib/components/task-status-toggle.svelte";

test("TaskStatusToggle: renders with correct icon for completed status", async () => {
  const mockToggle = vi.fn();
  
  const { getByRole } = render(TaskStatusToggle, {
    props: {
      status: "completed",
      ontoggle: mockToggle
    }
  });
  
  const button = getByRole("button");
  expect(button).toBeTruthy();
  expect(button.textContent).toContain("✅");
});

test("TaskStatusToggle: calls ontoggle when clicked", async () => {
  const mockToggle = vi.fn();
  
  const { getByRole } = render(TaskStatusToggle, {
    props: {
      status: "not_started",
      ontoggle: mockToggle
    }
  });
  
  const button = getByRole("button");
  await fireEvent.click(button);
  
  expect(mockToggle).toHaveBeenCalledTimes(1);
});

test("TaskStatusToggle: shows correct icons for different statuses", async () => {
  const mockToggle = vi.fn();
  
  // Test not_started status
  const { getByRole, rerender } = render(TaskStatusToggle, {
    props: {
      status: "not_started",
      ontoggle: mockToggle
    }
  });
  
  let button = getByRole("button");
  expect(button.textContent).toContain("⚪");
  
  // Test in_progress status
  await rerender({
    status: "in_progress",
    ontoggle: mockToggle
  });
  
  button = getByRole("button");
  expect(button.textContent).toContain("🔄");
});