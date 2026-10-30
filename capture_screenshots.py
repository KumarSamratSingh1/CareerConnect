import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def capture_all():
    os.makedirs('report_assets/screenshots', exist_ok=True)
    options = Options()
    options.add_argument('--headless=new')
    options.add_argument('--window-size=1366,850')
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    
    driver = webdriver.Chrome(options=options)
    wait = WebDriverWait(driver, 10)
    
    try:
        # 1. Home Page
        print("Capturing 01_home_page.png...")
        driver.get('http://localhost:5173/')
        time.sleep(2)
        driver.save_screenshot('report_assets/screenshots/01_home_page.png')
        
        # 2. Jobs Page
        print("Capturing 02_jobs_listing.png...")
        driver.get('http://localhost:5173/jobs')
        time.sleep(2)
        driver.save_screenshot('report_assets/screenshots/02_jobs_listing.png')
        
        # 3. Job Details Page
        print("Capturing 03_job_details.png...")
        driver.get('http://localhost:5173/jobs/1')
        time.sleep(2)
        driver.save_screenshot('report_assets/screenshots/03_job_details.png')
        
        # 4. Login Page
        print("Capturing 04_login_page.png...")
        driver.get('http://localhost:5173/login')
        time.sleep(1.5)
        driver.save_screenshot('report_assets/screenshots/04_login_page.png')
        
        # 5. Register Page
        print("Capturing 05_register_page.png...")
        driver.get('http://localhost:5173/register')
        time.sleep(1.5)
        driver.save_screenshot('report_assets/screenshots/05_register_page.png')
        
        # Log in as Candidate
        print("Logging in as Candidate (alex@example.com)...")
        driver.get('http://localhost:5173/login')
        time.sleep(1)
        email_input = driver.find_element(By.NAME, 'email') if driver.find_elements(By.NAME, 'email') else driver.find_elements(By.TAG_NAME, 'input')[0]
        pass_input = driver.find_element(By.NAME, 'password') if driver.find_elements(By.NAME, 'password') else driver.find_elements(By.TAG_NAME, 'input')[1]
        email_input.clear()
        email_input.send_keys('alex@example.com')
        pass_input.clear()
        pass_input.send_keys('Password123!')
        submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
        submit_btn.click()
        time.sleep(3)
        
        # 6. Candidate Dashboard
        print("Capturing 06_candidate_dashboard.png...")
        driver.get('http://localhost:5173/candidate/dashboard')
        time.sleep(2.5)
        driver.save_screenshot('report_assets/screenshots/06_candidate_dashboard.png')
        
        # 7. Candidate Profile
        print("Capturing 07_candidate_profile.png...")
        driver.get('http://localhost:5173/candidate/profile')
        time.sleep(2)
        driver.save_screenshot('report_assets/screenshots/07_candidate_profile.png')
        
        # 8. Resume Import Page
        print("Capturing 08_candidate_resume_import.png...")
        driver.get('http://localhost:5173/candidate/resume')
        time.sleep(2)
        driver.save_screenshot('report_assets/screenshots/08_candidate_resume_import.png')
        
        # 9. Candidate Applications
        print("Capturing 09_candidate_applications.png...")
        driver.get('http://localhost:5173/candidate/applications')
        time.sleep(2)
        driver.save_screenshot('report_assets/screenshots/09_candidate_applications.png')
        
        # 10. Candidate Saved Jobs
        print("Capturing 10_candidate_saved_jobs.png...")
        driver.get('http://localhost:5173/candidate/saved-jobs')
        time.sleep(2)
        driver.save_screenshot('report_assets/screenshots/10_candidate_saved_jobs.png')
        
        # 11. Candidate Interviews
        print("Capturing 11_candidate_interviews.png...")
        driver.get('http://localhost:5173/candidate/interviews')
        time.sleep(2)
        driver.save_screenshot('report_assets/screenshots/11_candidate_interviews.png')
        
        # Log out
        driver.execute_script("localStorage.clear(); sessionStorage.clear();")
        
        # Log in as Recruiter
        print("Logging in as Recruiter (recruiter@techcorp.com)...")
        driver.get('http://localhost:5173/login')
        time.sleep(1)
        inputs = driver.find_elements(By.TAG_NAME, 'input')
        inputs[0].clear()
        inputs[0].send_keys('recruiter@techcorp.com')
        inputs[1].clear()
        inputs[1].send_keys('Password123!')
        driver.find_element(By.XPATH, "//button[@type='submit']").click()
        time.sleep(3)
        
        # 12. Recruiter Dashboard
        print("Capturing 12_recruiter_dashboard.png...")
        driver.get('http://localhost:5173/recruiter/dashboard')
        time.sleep(2.5)
        driver.save_screenshot('report_assets/screenshots/12_recruiter_dashboard.png')
        
        # 13. Recruiter Company
        print("Capturing 13_recruiter_company.png...")
        driver.get('http://localhost:5173/recruiter/company')
        time.sleep(2)
        driver.save_screenshot('report_assets/screenshots/13_recruiter_company.png')
        
        # 14. Recruiter Jobs
        print("Capturing 14_recruiter_jobs.png...")
        driver.get('http://localhost:5173/recruiter/jobs')
        time.sleep(2)
        driver.save_screenshot('report_assets/screenshots/14_recruiter_jobs.png')
        
        # 15. Recruiter Applications
        print("Capturing 15_recruiter_applications.png...")
        driver.get('http://localhost:5173/recruiter/applications')
        time.sleep(2)
        driver.save_screenshot('report_assets/screenshots/15_recruiter_applications.png')
        
        # 16. Recruiter Interviews
        print("Capturing 16_recruiter_interviews.png...")
        driver.get('http://localhost:5173/recruiter/interviews')
        time.sleep(2)
        driver.save_screenshot('report_assets/screenshots/16_recruiter_interviews.png')
        
        # Log out
        driver.execute_script("localStorage.clear(); sessionStorage.clear();")
        
        # Log in as Admin
        print("Logging in as Admin (admin@careerconnect.com)...")
        driver.get('http://localhost:5173/login')
        time.sleep(1)
        inputs = driver.find_elements(By.TAG_NAME, 'input')
        inputs[0].clear()
        inputs[0].send_keys('admin@careerconnect.com')
        inputs[1].clear()
        inputs[1].send_keys('Password123!')
        driver.find_element(By.XPATH, "//button[@type='submit']").click()
        time.sleep(3)
        
        # 17. Admin Dashboard
        print("Capturing 17_admin_dashboard.png...")
        driver.get('http://localhost:5173/admin/dashboard')
        time.sleep(2.5)
        driver.save_screenshot('report_assets/screenshots/17_admin_dashboard.png')
        
        # 18. Admin Users
        print("Capturing 18_admin_users.png...")
        driver.get('http://localhost:5173/admin/users')
        time.sleep(2)
        driver.save_screenshot('report_assets/screenshots/18_admin_users.png')
        
        # 19. Admin Companies
        print("Capturing 19_admin_companies.png...")
        driver.get('http://localhost:5173/admin/companies')
        time.sleep(2)
        driver.save_screenshot('report_assets/screenshots/19_admin_companies.png')
        
        # 20. Admin Jobs
        print("Capturing 20_admin_jobs.png...")
        driver.get('http://localhost:5173/admin/jobs')
        time.sleep(2)
        driver.save_screenshot('report_assets/screenshots/20_admin_jobs.png')
        
        print("All genuine screenshots captured successfully!")
        
    finally:
        driver.quit()

if __name__ == '__main__':
    capture_all()
