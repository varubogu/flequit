import { test, expect, vi, beforeEach } from "vitest";
import { DataService } from "../../src/lib/services/data-service";

// Mock the imports
vi.mock("../../src/lib/stores/tasks.svelte", () => ({
  taskStore: {
    setProjects: vi.fn(),
    projects: []
  }
}));

vi.mock("../../src/lib/data/sample-data", () => ({
  generateSampleData: vi.fn(() => [
    {
      id: "project-1",
      name: "Sample Project",
      task_lists: []
    }
  ])
}));

// Get the mocked dependencies for use in tests
const mockTaskStore = vi.mocked(await import("../../src/lib/stores/tasks.svelte")).taskStore;
const mockGenerateSampleData = vi.mocked(await import("../../src/lib/data/sample-data")).generateSampleData;

// Mock console.log to avoid noise in tests
const mockConsoleLog = vi.fn();
console.log = mockConsoleLog;

beforeEach(() => {
  vi.clearAllMocks();
});

test("DataService.initializeSampleData: generates and sets sample data", () => {
  const sampleData = [
    { id: "project-1", name: "Sample Project", task_lists: [] }
  ];
  mockGenerateSampleData.mockReturnValue(sampleData);
  
  DataService.initializeSampleData();
  
  expect(mockGenerateSampleData).toHaveBeenCalledTimes(1);
  expect(mockTaskStore.setProjects).toHaveBeenCalledWith(sampleData);
});

test("DataService.loadUserData: calls initializeSampleData", () => {
  const sampleData = [
    { id: "project-1", name: "Sample Project", task_lists: [] }
  ];
  mockGenerateSampleData.mockReturnValue(sampleData);
  
  DataService.loadUserData();
  
  expect(mockGenerateSampleData).toHaveBeenCalledTimes(1);
  expect(mockTaskStore.setProjects).toHaveBeenCalledWith(sampleData);
});

test("DataService.saveUserData: logs saving message with projects", () => {
  const projects = [{ id: "project-1", name: "Test Project" }];
  mockTaskStore.projects = projects;
  
  DataService.saveUserData();
  
  expect(mockConsoleLog).toHaveBeenCalledWith('Saving user data...', projects);
});