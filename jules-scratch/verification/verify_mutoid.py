import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Listen for console messages
        page.on("console", lambda msg: print(f"Browser console: {msg.text()}"))

        try:
            await page.goto("http://localhost:5173/", timeout=60000)

            # Wait for the canvas to be visible with a longer timeout
            canvas = page.locator("canvas")
            await expect(canvas).to_be_visible(timeout=10000)

            # Take a screenshot before clicking start
            await page.screenshot(path="jules-scratch/verification/before_start.png")

            # Click the start button in the middle of the canvas
            await page.mouse.click(128, 330)

            # Wait for the game to load and mutoid to appear
            await page.wait_for_timeout(2000)

            await page.screenshot(path="jules-scratch/verification/after_start.png")

        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path="jules-scratch/verification/error.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())