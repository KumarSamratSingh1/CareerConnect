import os
import time
import requests
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

def main():
    os.makedirs('report_assets/screenshots', exist_ok=True)
    backend_url = 'http://localhost:8080/api/v1'
    
    cand_resp = requests.post(f"{backend_url}/auth/login", json={"email": "alex@example.com", "password": "Password123!"}).json()
    cand_token = cand_resp['data']['token']
    
    rec_resp = requests.post(f"{backend_url}/auth/login", json={"email": "recruiter@techcorp.com", "password": "Password123!"}).json()
    rec_token = rec_resp['data']['token']
    
    admin_resp = requests.post(f"{backend_url}/auth/login", json={"email": "admin@careerconnect.com", "password": "Password123!"}).json()
    admin_token = admin_resp['data']['token']
    
    options = Options()
    options.add_argument('--headless=new')
    options.add_argument('--window-size=1400,900')
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    
    driver = webdriver.Chrome(options=options)
    
    try:
        # Public Pages
        print("1. Capturing 01_home_page.png...")
        driver.get('http://localhost:5173/')
        time.sleep(2)
        driver.save_screenshot('report_assets/screenshots/01_home_page.png')
        
        print("2. Capturing 02_jobs_listing.png...")
        driver.get('http://localhost:5173/jobs')
        time.sleep(2)
        driver.save_screenshot('report_assets/screenshots/02_jobs_listing.png')
        
        print("3. Capturing 03_job_details.png...")
        driver.get('http://localhost:5173/jobs/1')
        time.sleep(2)
        driver.save_screenshot('report_assets/screenshots/03_job_details.png')
        
        print("4. Capturing 04_login_page.png...")
        driver.get('http://localhost:5173/login')
        time.sleep(1.5)
        driver.save_screenshot('report_assets/screenshots/04_login_page.png')
        
        print("5. Capturing 05_register_page.png...")
        driver.get('http://localhost:5173/register')
        time.sleep(1.5)
        driver.save_screenshot('report_assets/screenshots/05_register_page.png')
        
        # Candidate Session
        print("Authenticating Candidate...")
        driver.get('http://localhost:5173/')
        driver.execute_script('''
            localStorage.setItem('careerconnect_token', arguments[0]);
            localStorage.setItem('careerconnect_user', JSON.stringify({email: 'alex@example.com', role: 'CANDIDATE'}));
        ''', cand_token)
        
        print("6. Capturing 06_candidate_dashboard.png...")
        driver.get('http://localhost:5173/candidate/dashboard')
        time.sleep(2.5)
        driver.save_screenshot('report_assets/screenshots/06_candidate_dashboard.png')
        
        print("7. Capturing 07_candidate_profile.png...")
        driver.get('http://localhost:5173/candidate/profile')
        time.sleep(2)
        driver.save_screenshot('report_assets/screenshots/07_candidate_profile.png')
        
        print("8. Capturing 08_candidate_resume_import.png...")
        driver.get('http://localhost:5173/candidate/resume')
        time.sleep(2)
        driver.save_screenshot('report_assets/screenshots/08_candidate_resume_import.png')
        
        print("9. Capturing 09_candidate_applications.png...")
        driver.get('http://localhost:5173/candidate/applications')
        time.sleep(2)
        driver.save_screenshot('report_assets/screenshots/09_candidate_applications.png')
        
        print("10. Capturing 10_candidate_saved_jobs.png...")
        driver.get('http://localhost:5173/candidate/saved-jobs')
        time.sleep(2)
        driver.save_screenshot('report_assets/screenshots/10_candidate_saved_jobs.png')
        
        print("11. Capturing 11_candidate_interviews.png...")
        driver.get('http://localhost:5173/candidate/interviews')
        time.sleep(2)
        driver.save_screenshot('report_assets/screenshots/11_candidate_interviews.png')
        
        # Recruiter Session
        print("Authenticating Recruiter...")
        driver.get('http://localhost:5173/')
        driver.execute_script('''
            localStorage.setItem('careerconnect_token', arguments[0]);
            localStorage.setItem('careerconnect_user', JSON.stringify({email: 'recruiter@techcorp.com', role: 'RECRUITER'}));
        ''', rec_token)
        
        print("12. Capturing 12_recruiter_dashboard.png...")
        driver.get('http://localhost:5173/recruiter/dashboard')
        time.sleep(2.5)
        driver.save_screenshot('report_assets/screenshots/12_recruiter_dashboard.png')
        
        print("13. Capturing 13_recruiter_company.png...")
        driver.get('http://localhost:5173/recruiter/company')
        time.sleep(2)
        driver.save_screenshot('report_assets/screenshots/13_recruiter_company.png')
        
        print("14. Capturing 14_recruiter_jobs.png...")
        driver.get('http://localhost:5173/recruiter/jobs')
        time.sleep(2)
        driver.save_screenshot('report_assets/screenshots/14_recruiter_jobs.png')
        
        print("15. Capturing 15_recruiter_applications.png...")
        driver.get('http://localhost:5173/recruiter/applications')
        time.sleep(2)
        driver.save_screenshot('report_assets/screenshots/15_recruiter_applications.png')
        
        print("16. Capturing 16_recruiter_interviews.png...")
        driver.get('http://localhost:5173/recruiter/interviews')
        time.sleep(2)
        driver.save_screenshot('report_assets/screenshots/16_recruiter_interviews.png')
        
        # Admin Session
        print("Authenticating Admin...")
        driver.get('http://localhost:5173/')
        driver.execute_script('''
            localStorage.setItem('careerconnect_token', arguments[0]);
            localStorage.setItem('careerconnect_user', JSON.stringify({email: 'admin@careerconnect.com', role: 'ADMIN'}));
        ''', admin_token)
        
        print("17. Capturing 17_admin_dashboard.png...")
        driver.get('http://localhost:5173/admin/dashboard')
        time.sleep(2.5)
        driver.save_screenshot('report_assets/screenshots/17_admin_dashboard.png')
        
        print("18. Capturing 18_admin_users.png...")
        driver.get('http://localhost:5173/admin/users')
        time.sleep(2)
        driver.save_screenshot('report_assets/screenshots/18_admin_users.png')
        
        print("19. Capturing 19_admin_companies.png...")
        driver.get('http://localhost:5173/admin/companies')
        time.sleep(2)
        driver.save_screenshot('report_assets/screenshots/19_admin_companies.png')
        
        print("20. Capturing 20_admin_jobs.png...")
        driver.get('http://localhost:5173/admin/jobs')
        time.sleep(2)
        driver.save_screenshot('report_assets/screenshots/20_admin_jobs.png')
        
        print("All screenshots successfully captured!")
    finally:
        driver.quit()

if __name__ == '__main__':
    main()
