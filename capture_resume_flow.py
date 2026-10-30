import os
import time
import requests
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

def main():
    backend_url = 'http://localhost:8080/api/v1'
    cand_resp = requests.post(f"{backend_url}/auth/login", json={"email": "alex@example.com", "password": "Password123!"}).json()
    cand_token = cand_resp['data']['token']
    
    options = Options()
    options.add_argument('--headless=new')
    options.add_argument('--window-size=1400,1050')
    driver = webdriver.Chrome(options=options)
    
    try:
        driver.get('http://localhost:5173/')
        driver.execute_script('''
            localStorage.setItem('careerconnect_token', arguments[0]);
            localStorage.setItem('careerconnect_user', JSON.stringify({email: 'alex@example.com', role: 'CANDIDATE'}));
        ''', cand_token)
        
        driver.get('http://localhost:5173/candidate/resume')
        time.sleep(2)
        
        # Find file input and upload sample_resume.pdf
        pdf_path = os.path.abspath('report_assets/sample_resume.pdf')
        file_input = driver.find_element(By.CSS_SELECTOR, "input[type='file']")
        file_input.send_keys(pdf_path)
        time.sleep(1)
        
        # Click Extract & Review Resume
        extract_btn = driver.find_element(By.XPATH, "//button[contains(., 'Extract & Review Resume')]")
        extract_btn.click()
        time.sleep(4)
        
        # Capture Draft Review Step
        driver.save_screenshot('report_assets/screenshots/08b_resume_draft_review.png')
        print("Captured 08b_resume_draft_review.png!")
        
        # Check overwrite approval checkboxes if present
        checkboxes = driver.find_elements(By.CSS_SELECTOR, ".resume-overwrite-checkbox input")
        for cb in checkboxes:
            if not cb.is_selected():
                cb.click()
        time.sleep(0.5)
        
        # Click Approve & Import Selected
        import_btn = driver.find_element(By.XPATH, "//button[contains(., 'Approve & Import Selected')]")
        import_btn.click()
        time.sleep(3)
        
        # Capture Summary Step
        driver.save_screenshot('report_assets/screenshots/08c_resume_import_summary.png')
        print("Captured 08c_resume_import_summary.png!")
        
    finally:
        driver.quit()

if __name__ == '__main__':
    main()
