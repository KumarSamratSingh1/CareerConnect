from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import os
import time

html = """<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 0; padding: 20px; background: transparent; font-family: 'Arial', sans-serif; display: flex; align-items: center; justify-content: center; }
  .logo-container { display: flex; align-items: center; gap: 14px; background: white; padding: 12px 20px; border-radius: 8px; }
  .symbol { width: 68px; height: 68px; background: #c8102e; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; text-align: center; font-weight: bold; }
  .symbol-gear { font-size: 26px; line-height: 1; }
  .symbol-cu { font-size: 16px; font-weight: 900; letter-spacing: 1px; }
  .symbol-text { font-size: 6px; letter-spacing: 0.5px; text-transform: uppercase; }
  .text-block { display: flex; flex-direction: column; }
  .univ-title { font-size: 26px; font-weight: 900; color: #c8102e; letter-spacing: 0.5px; line-height: 1.05; }
  .univ-sub { font-size: 24px; font-weight: 900; color: #1e293b; letter-spacing: 0.5px; line-height: 1.05; }
  .tagline { font-size: 11px; color: #64748b; font-weight: 600; letter-spacing: 0.8px; margin-top: 4px; }
</style>
</head>
<body>
<div class="logo-container" id="logo">
  <div class="symbol">
    <div class="symbol-gear">⚙️</div>
    <div class="symbol-cu">CU</div>
    <div class="symbol-text">CHANDIGARH</div>
  </div>
  <div class="text-block">
    <div class="univ-title">CHANDIGARH</div>
    <div class="univ-sub">UNIVERSITY</div>
    <div class="tagline">Discover . Learn . Empower</div>
  </div>
</div>
</body>
</html>
"""

with open("report_assets/cu_logo.html", "w", encoding="utf-8") as f:
    f.write(html)

options = Options()
options.add_argument("--headless=new")
options.add_argument("--window-size=500,250")
driver = webdriver.Chrome(options=options)
try:
    driver.get("file:///" + os.path.abspath("report_assets/cu_logo.html").replace("\\", "/"))
    time.sleep(1)
    element = driver.find_element("id", "logo")
    element.screenshot("report_assets/cu_logo.png")
    print("CU logo generated!")
finally:
    driver.quit()
