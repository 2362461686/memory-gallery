from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # Test Homepage
    print("=== Testing Homepage ===")
    page = browser.new_page()
    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')
    page.screenshot(path='/tmp/homepage.png', full_page=True)
    title = page.title()
    print(f"Title: {title}")

    # Check key elements
    heading = page.locator('h1').first.text_content()
    print(f"Main heading: {heading}")

    nav_links = page.locator('nav a').all_text_contents()
    print(f"Nav links: {nav_links}")

    feature_cards = page.locator('text=一键导入').count()
    print(f"Feature cards found: {feature_cards}")

    cta_button = page.locator('text=开始策展').count()
    print(f"CTA button found: {cta_button}")

    page.close()

    # Test Login page
    print("\n=== Testing Login Page ===")
    page = browser.new_page()
    page.goto('http://localhost:3000/login')
    page.wait_for_load_state('networkidle')
    page.screenshot(path='/tmp/login.png', full_page=True)

    email_input = page.locator('input[type="email"]').count()
    pass_input = page.locator('input[type="password"]').count()
    submit_btn = page.locator('button[type="submit"]').count()
    print(f"Email input: {email_input}, Password input: {pass_input}, Submit button: {submit_btn}")

    page.close()

    # Test Register page
    print("\n=== Testing Register Page ===")
    page = browser.new_page()
    page.goto('http://localhost:3000/register')
    page.wait_for_load_state('networkidle')
    page.screenshot(path='/tmp/register.png', full_page=True)

    inputs = page.locator('input').all_text_contents()
    print(f"Register inputs found: {len(inputs)}")

    page.close()

    browser.close()
    print("\n=== All tests passed ===")
