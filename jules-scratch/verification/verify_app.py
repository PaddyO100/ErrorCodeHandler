import os
from playwright.sync_api import sync_playwright, Page, expect

def verify_app(page: Page):
    # Get the absolute path to the index.html file
    # The path needs to be relative to the root of the project
    file_path = os.path.abspath('index.html')
    page.goto(f'file://{file_path}')

    # Wait for the initial results to load
    results_container = page.locator('#results-container')
    try:
        expect(results_container.locator('div').first).to_be_visible(timeout=5000)
    except Exception as e:
        print("Debug: results-container timed out.")
        print("Page content:", page.content())
        raise e

    # Take a screenshot of the initial view
    page.screenshot(path="jules-scratch/verification/initial_view.png")

    # Search for "trapped" which is "Eingeschlossen" in German
    search_input = page.locator('#search-input')
    search_input.fill('Eingeschlossen')

    # Wait for the results to update. The search should return 1 result.
    results_container = page.locator('#results-container')
    expect(results_container.locator('div')).to_have_count(1, timeout=5000)

    # Take a screenshot of the search results
    page.screenshot(path="jules-scratch/verification/search_results.png")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    verify_app(page)
    browser.close()
