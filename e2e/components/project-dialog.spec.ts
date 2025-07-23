import { test, expect } from '@playwright/test';

test.describe('ProjectDialog Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/project-dialog');
    // Wait for the page to fully load
    await expect(page.getByTestId('open-add-dialog')).toBeVisible();
  });

  test('should open in add mode, fill form, and save', async ({ page }) => {
    // Open the dialog
    await page.getByTestId('open-add-dialog').click();

    // Check title
    await expect(page.getByRole('heading', { name: 'New Project' })).toBeVisible();

    // Fill the form
    await page.getByLabel('Project Name').fill('My New Project');
    await page.getByLabel('Project Color').fill('#00ff00');

    // Save
    await page.getByRole('button', { name: 'Save' }).click();

    // Verify the saved data is displayed on the page
    const savedData = page.getByTestId('saved-data');
    await expect(savedData).toContainText('"name": "My New Project"');
    await expect(savedData).toContainText('"color": "#00ff00"');

    // Verify the dialog is closed
    await expect(page.getByRole('heading', { name: 'New Project' })).not.toBeVisible();
  });

  test('should open in edit mode with initial values and save changes', async ({ page }) => {
    // Open the dialog
    await page.getByTestId('open-edit-dialog').click();

    // Check title
    await expect(page.getByRole('heading', { name: 'Edit Project' })).toBeVisible();

    // Check initial values
    await expect(page.getByLabel('Project Name')).toHaveValue('Existing Project');
    await expect(page.getByLabel('Project Color')).toHaveValue('#ff0000');

    // Change the values
    await page.getByLabel('Project Name').fill('Updated Project');
    await page.getByLabel('Project Color').fill('#0000ff');

    // Save
    await page.getByRole('button', { name: 'Save' }).click();

    // Verify the saved data
    const savedData = page.getByTestId('saved-data');
    await expect(savedData).toContainText('"name": "Updated Project"');
    await expect(savedData).toContainText('"color": "#0000ff"');

    // Verify the dialog is closed
    await expect(page.getByRole('heading', { name: 'Edit Project' })).not.toBeVisible();
  });

  test('should close the dialog on cancel button click', async ({ page }) => {
    // Open the dialog
    await page.getByTestId('open-add-dialog').click();
    await expect(page.getByRole('heading', { name: 'New Project' })).toBeVisible();

    // Click cancel
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Verify the dialog is closed
    await expect(page.getByRole('heading', { name: 'New Project' })).not.toBeVisible();
  });

  test('save button should be disabled if name is empty', async ({ page }) => {
    // Open the dialog
    await page.getByTestId('open-edit-dialog').click();

    // Clear the name field
    await page.getByLabel('Project Name').fill('');

    // Check that the save button is disabled
    await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
  });
});
