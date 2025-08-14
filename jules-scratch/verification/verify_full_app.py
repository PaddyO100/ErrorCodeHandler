import os
from playwright.sync_api import sync_playwright, Page, expect

BASE_URL = 'http://127.0.0.1:5001'
ADMIN_PASSWORD = '12345678'
TEST_ERROR = {
    "Code": "9999",
    "HMI Message": "Test Fehler",
    "Cause": "Test Ursache",
    "Action": "Test Aktion",
    "Platforms": "P99"
}

def test_full_application(page: Page):
    print("--- Testing Main Page ---")
    page.goto(BASE_URL)
    expect(page.locator('#results-container div').first).to_be_visible(timeout=10000)
    page.screenshot(path='jules-scratch/verification/01_main_page.png')

    print("--- Testing Search ---")
    page.locator('#search-input').fill('trapped')
    expect(page.locator('#results-container div')).to_have_count(1)
    page.screenshot(path='jules-scratch/verification/02_search_result.png')

    print("--- Testing Filter ---")
    page.locator('#search-input').fill('')
    page.locator('#platform-filter').select_option('P25')
    expect(page.locator('div:has-text("Wheel motor blocked, right")').first).to_be_visible()
    page.screenshot(path='jules-scratch/verification/03_filter_result.png')

    print("--- Testing Login ---")
    page.goto(f'{BASE_URL}/login')
    page.locator('#password').fill(ADMIN_PASSWORD)
    page.locator('button[type="submit"]').click()
    expect(page).to_have_url(f'{BASE_URL}/admin')
    expect(page.locator('h1:has-text("Admin Panel")')).to_be_visible()
    page.screenshot(path='jules-scratch/verification/04_admin_page.png')

    print("--- Testing Add Error ---")
    page.locator('#code').fill(TEST_ERROR["Code"])
    page.locator('#hmi-message').fill(TEST_ERROR["HMI Message"])
    page.locator('#cause').fill(TEST_ERROR["Cause"])
    page.locator('#action').fill(TEST_ERROR["Action"])
    page.locator('#platforms').fill(TEST_ERROR["Platforms"])
    page.locator('#form-submit-btn').click()

    print("--- Verifying Add ---")
    # Wait for the table to update
    expect(page.locator(f'td:has-text("{TEST_ERROR["Code"]}")')).to_be_visible()
    page.screenshot(path='jules-scratch/verification/05_added_error.png')

    print("--- Testing Delete Error ---")
    # Set up the dialog handler BEFORE clicking the button
    page.on("dialog", lambda dialog: dialog.accept())
    page.locator(f'tr:has-text("{TEST_ERROR["Code"]}") button:has-text("Löschen")').click()

    print("--- Verifying Delete ---")
    expect(page.locator(f'td:has-text("{TEST_ERROR["Code"]}")')).not_to_be_visible()
    page.screenshot(path='jules-scratch/verification/06_deleted_error.png')

    print("--- Testing Logout ---")
    page.locator('a:has-text("Abmelden")').click()
    expect(page).to_have_url(f'{BASE_URL}/login')
    expect(page.locator('h1:has-text("Admin Login")')).to_be_visible()
    page.screenshot(path='jules-scratch/verification/07_logout_page.png')

    print("--- Verification script completed successfully! ---")


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    test_full_application(page)
    browser.close()
