import os
from playwright.sync_api import sync_playwright, Page

BASE_URL = 'http://127.0.0.1:5001'

def simple_test(page: Page):
    print(f"--- Navigating to {BASE_URL} ---")
    page.goto(BASE_URL)
    print("--- Waiting for 5 seconds ---")
    page.wait_for_timeout(5000) # Wait 5 seconds for everything to load
    print("--- Taking screenshot ---")
    page.screenshot(path='jules-scratch/verification/simple_screenshot.png')
    print("--- Screenshot taken ---")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    simple_test(page)
    browser.close()
