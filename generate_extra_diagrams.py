import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

os.makedirs('report_assets/diagrams', exist_ok=True)

# 1. ER Diagram HTML
html_er = """<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #ffffff; color: #0f172a; display: flex; justify-content: center; }
  .canvas { width: 1100px; padding: 25px; border: 2px solid #cbd5e1; border-radius: 12px; background: #f8fafc; }
  .title { text-align: center; font-size: 22px; font-weight: 700; color: #1e293b; margin-bottom: 20px; }
  .subtitle { text-align: center; font-size: 13px; color: #64748b; margin-top: -15px; margin-bottom: 25px; }
  .tables-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
  .table-card { background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.04); font-size: 11px; }
  .table-header { padding: 6px 10px; font-weight: 700; color: white; display: flex; justify-content: space-between; }
  .th-user { background: #2563eb; }
  .th-cand { background: #0284c7; }
  .th-rec { background: #059669; }
  .th-job { background: #d97706; }
  .th-app { background: #7c3aed; }
  .th-int { background: #dc2626; }
  .field-list { padding: 8px 10px; line-height: 1.6; }
  .pk { font-weight: 700; color: #b91c1c; }
  .fk { font-weight: 600; color: #2563eb; }
  .legend { display: flex; justify-content: center; gap: 20px; margin-top: 20px; font-size: 12px; font-weight: 600; }
  .rel-line { margin-top: 15px; background: #e2e8f0; border-radius: 6px; padding: 10px 15px; font-size: 11.5px; color: #334155; line-height: 1.6; }
</style>
</head>
<body>
<div class="canvas">
  <div class="title">CareerConnect Relational Database Entity-Relationship (ER) Schema</div>
  <div class="subtitle">Complete MySQL 8.0 Relational Entity Mappings with Foreign Keys and Referential Integrity</div>
  
  <div class="tables-grid">
    <!-- Users -->
    <div class="table-card">
      <div class="table-header th-user"><span>users</span><span>Core</span></div>
      <div class="field-list">
        <div><span class="pk">PK</span> id (BIGINT)</div>
        <div>email (VARCHAR 100, UQ)</div>
        <div>password (VARCHAR 255)</div>
        <div>full_name (VARCHAR 100)</div>
        <div>role (ENUM: CAND, REC, ADM)</div>
        <div>enabled (BOOLEAN)</div>
        <div>provider (VARCHAR 20)</div>
        <div>created_at, updated_at</div>
      </div>
    </div>

    <!-- Candidate Profiles -->
    <div class="table-card">
      <div class="table-header th-cand"><span>candidate_profiles</span><span>Candidate</span></div>
      <div class="field-list">
        <div><span class="pk">PK</span> id (BIGINT)</div>
        <div><span class="fk">FK</span> user_id (BIGINT, UQ)</div>
        <div>title (VARCHAR 150)</div>
        <div>bio (TEXT)</div>
        <div>phone (VARCHAR 20)</div>
        <div>location (VARCHAR 100)</div>
        <div>resume_url (VARCHAR 255)</div>
        <div>github_url, linkedin_url</div>
        <div>profile_completed (INT)</div>
      </div>
    </div>

    <!-- Companies -->
    <div class="table-card">
      <div class="table-header th-rec"><span>companies</span><span>Recruiter</span></div>
      <div class="field-list">
        <div><span class="pk">PK</span> id (BIGINT)</div>
        <div>name (VARCHAR 150)</div>
        <div>description (TEXT)</div>
        <div>website (VARCHAR 200)</div>
        <div>location (VARCHAR 100)</div>
        <div>logo_url (VARCHAR 255)</div>
        <div>is_verified (BOOLEAN)</div>
        <div>created_at (DATETIME)</div>
      </div>
    </div>

    <!-- Recruiter Profiles -->
    <div class="table-card">
      <div class="table-header th-rec"><span>recruiter_profiles</span><span>Recruiter</span></div>
      <div class="field-list">
        <div><span class="pk">PK</span> id (BIGINT)</div>
        <div><span class="fk">FK</span> user_id (BIGINT, UQ)</div>
        <div><span class="fk">FK</span> company_id (BIGINT)</div>
        <div>designation (VARCHAR 100)</div>
        <div>department (VARCHAR 100)</div>
      </div>
    </div>

    <!-- Educations -->
    <div class="table-card">
      <div class="table-header th-cand"><span>candidate_educations</span><span>Portfolio</span></div>
      <div class="field-list">
        <div><span class="pk">PK</span> id (BIGINT)</div>
        <div><span class="fk">FK</span> candidate_id (BIGINT)</div>
        <div>institution (VARCHAR 150)</div>
        <div>degree (VARCHAR 100)</div>
        <div>field_of_study (VARCHAR 100)</div>
        <div>start_date, end_date (DATE)</div>
        <div>grade, is_current</div>
      </div>
    </div>

    <!-- Experiences -->
    <div class="table-card">
      <div class="table-header th-cand"><span>candidate_experiences</span><span>Portfolio</span></div>
      <div class="field-list">
        <div><span class="pk">PK</span> id (BIGINT)</div>
        <div><span class="fk">FK</span> candidate_id (BIGINT)</div>
        <div>company (VARCHAR 150)</div>
        <div>job_title (VARCHAR 100)</div>
        <div>location (VARCHAR 100)</div>
        <div>start_date, end_date (DATE)</div>
        <div>is_current, description</div>
      </div>
    </div>

    <!-- Skills -->
    <div class="table-card">
      <div class="table-header th-cand"><span>candidate_skills</span><span>Portfolio</span></div>
      <div class="field-list">
        <div><span class="pk">PK</span> id (BIGINT)</div>
        <div><span class="fk">FK</span> candidate_id (BIGINT)</div>
        <div><span class="fk">FK</span> skill_id (BIGINT)</div>
        <div>years_experience (INT)</div>
        <div><em>skills table: id, name, category</em></div>
      </div>
    </div>

    <!-- Projects & Certs -->
    <div class="table-card">
      <div class="table-header th-cand"><span>projects & certs</span><span>Portfolio</span></div>
      <div class="field-list">
        <div><span class="pk">PK</span> id (BIGINT)</div>
        <div><span class="fk">FK</span> candidate_id (BIGINT)</div>
        <div>title / cert_name</div>
        <div>technologies / org</div>
        <div>project_url / cred_id</div>
        <div>start_date, end_date</div>
      </div>
    </div>

    <!-- Jobs -->
    <div class="table-card">
      <div class="table-header th-job"><span>jobs</span><span>Marketplace</span></div>
      <div class="field-list">
        <div><span class="pk">PK</span> id (BIGINT)</div>
        <div><span class="fk">FK</span> company_id (BIGINT)</div>
        <div><span class="fk">FK</span> recruiter_id (BIGINT)</div>
        <div>title (VARCHAR 150)</div>
        <div>job_type (FULL_TIME, INTERN)</div>
        <div>salary_min, salary_max</div>
        <div>status (ACTIVE, CLOSED)</div>
        <div>deadline (DATETIME)</div>
      </div>
    </div>

    <!-- Job Applications -->
    <div class="table-card">
      <div class="table-header th-app"><span>job_applications</span><span>Applications</span></div>
      <div class="field-list">
        <div><span class="pk">PK</span> id (BIGINT)</div>
        <div><span class="fk">FK</span> job_id (BIGINT)</div>
        <div><span class="fk">FK</span> candidate_id (BIGINT)</div>
        <div>status (ENUM: 6 states)</div>
        <div>cover_letter (TEXT)</div>
        <div>resume_url (VARCHAR 255)</div>
        <div>applied_at, updated_at</div>
      </div>
    </div>

    <!-- Interviews -->
    <div class="table-card">
      <div class="table-header th-int"><span>interviews</span><span>Coordination</span></div>
      <div class="field-list">
        <div><span class="pk">PK</span> id (BIGINT)</div>
        <div><span class="fk">FK</span> application_id (BIGINT)</div>
        <div>interview_date (DATE)</div>
        <div>start_time, end_time (TIME)</div>
        <div>interview_type (ONLINE/IN_PERSON)</div>
        <div>location_or_link (VARCHAR 255)</div>
        <div>status (SCHEDULED/COMPLETED)</div>
      </div>
    </div>

    <!-- Saved Jobs & History -->
    <div class="table-card">
      <div class="table-header th-app"><span>saved_jobs & history</span><span>Lifecycle</span></div>
      <div class="field-list">
        <div><strong>saved_jobs:</strong> candidate_id, job_id</div>
        <div><strong>status_history:</strong></div>
        <div>• application_id (FK)</div>
        <div>• old_status, new_status</div>
        <div>• notes, changed_by_user_id</div>
        <div>• created_at (DATETIME)</div>
      </div>
    </div>
  </div>

  <div class="rel-line">
    <strong>Key Cardinalities:</strong>
    <code>users (1) ── (1) candidate_profiles</code> | 
    <code>users (1) ── (1) recruiter_profiles (M) ── (1) companies</code> | 
    <code>companies (1) ── (M) jobs</code> | 
    <code>candidate_profiles (1) ── (M) [educations, experiences, skills, projects, certs]</code> | 
    <code>jobs (1) ── (M) job_applications (M) ── (1) candidate_profiles</code> | 
    <code>job_applications (1) ── (M) application_status_history</code> | 
    <code>job_applications (1) ── (M) interviews</code>
  </div>
</div>
</body>
</html>
"""

# 2. Use Case Diagram HTML
html_usecase = """<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #ffffff; color: #0f172a; display: flex; justify-content: center; }
  .canvas { width: 1050px; padding: 25px; border: 2px solid #cbd5e1; border-radius: 12px; background: #ffffff; }
  .title { text-align: center; font-size: 22px; font-weight: 700; color: #1e293b; margin-bottom: 25px; }
  .usecase-layout { display: flex; justify-content: space-between; align-items: stretch; gap: 20px; }
  .actors-col { width: 160px; display: flex; flex-direction: column; justify-content: space-around; }
  .actor-box { background: #f1f5f9; border: 1.5px solid #94a3b8; border-radius: 8px; padding: 12px; text-align: center; }
  .actor-icon { font-size: 28px; }
  .actor-name { font-size: 13px; font-weight: 700; color: #1e293b; margin-top: 5px; }
  .boundary { flex: 1; border: 2px dashed #0284c7; border-radius: 12px; padding: 20px; background: #f0f9ff; position: relative; }
  .boundary-label { position: absolute; top: -12px; left: 20px; background: #0284c7; color: white; padding: 2px 12px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
  .uc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .uc-oval { background: #ffffff; border: 1.5px solid #0284c7; border-radius: 20px; padding: 8px 14px; font-size: 11.5px; font-weight: 600; color: #0369a1; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
  .uc-cand { border-color: #0284c7; color: #0369a1; }
  .uc-rec { border-color: #059669; color: #047857; }
  .uc-adm { border-color: #d97706; color: #b45309; }
  .uc-sys { border-color: #7c3aed; color: #6d28d9; }
</style>
</head>
<body>
<div class="canvas">
  <div class="title">CareerConnect System Use Case Diagram</div>
  
  <div class="usecase-layout">
    <div class="actors-col">
      <div class="actor-box">
        <div class="actor-icon">👨‍🎓</div>
        <div class="actor-name">Candidate</div>
      </div>
      <div class="actor-box">
        <div class="actor-icon">🏢</div>
        <div class="actor-name">Recruiter</div>
      </div>
      <div class="actor-box">
        <div class="actor-icon">🛡️</div>
        <div class="actor-name">Administrator</div>
      </div>
      <div class="actor-box">
        <div class="actor-icon">⏰</div>
        <div class="actor-name">Job Expiry Scheduler</div>
      </div>
    </div>
    
    <div class="boundary">
      <div class="boundary-label">CareerConnect Application System Boundary</div>
      <div class="uc-grid">
        <div class="uc-oval uc-cand">UC-1: Register & Authenticate (JWT)</div>
        <div class="uc-oval uc-cand">UC-2: Manage Portfolio & Strength Meter</div>
        <div class="uc-oval uc-cand">UC-3: Upload Resume & Trigger Parsing (RI-3)</div>
        <div class="uc-oval uc-cand">UC-4: Review Draft & Import into Profile</div>
        <div class="uc-oval uc-cand">UC-5: Search & Filter Active Job Postings</div>
        <div class="uc-oval uc-cand">UC-6: Submit Job Application & Cover Letter</div>
        <div class="uc-oval uc-cand">UC-7: Bookmark / Save Jobs for Later</div>
        <div class="uc-oval uc-cand">UC-8: View Scheduled Interviews & Join Link</div>
        
        <div class="uc-oval uc-rec">UC-9: Setup & Verify Corporate Profile</div>
        <div class="uc-oval uc-rec">UC-10: Post, Update & Close Job Listings</div>
        <div class="uc-oval uc-rec">UC-11: Review Applications & Candidate Profiles</div>
        <div class="uc-oval uc-rec">UC-12: Transition Application Lifecycle State</div>
        <div class="uc-oval uc-rec">UC-13: Schedule Interview & Generate Link</div>
        <div class="uc-oval uc-rec">UC-14: Track Pipeline Metrics & Funnel</div>
        
        <div class="uc-oval uc-adm">UC-15: Monitor Platform Telemetry & KPI Stats</div>
        <div class="uc-oval uc-adm">UC-16: Audit Directory & Toggle User Accounts</div>
        <div class="uc-oval uc-adm">UC-17: Verify Company Credentials (KYC)</div>
        <div class="uc-oval uc-adm">UC-18: Moderate & Policy-Enforce Job Postings</div>
        
        <div class="uc-oval uc-sys">UC-19: Cron Job: Auto-expire Overdue Postings</div>
        <div class="uc-oval uc-sys">UC-20: Security: Stateless Bearer Token Guard</div>
      </div>
    </div>
  </div>
</div>
</body>
</html>
"""

# 3. RI-3 Flowchart HTML
html_ri3 = """<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #ffffff; color: #0f172a; display: flex; justify-content: center; }
  .canvas { width: 1050px; padding: 25px; border: 2px solid #cbd5e1; border-radius: 12px; background: #ffffff; }
  .title { text-align: center; font-size: 21px; font-weight: 700; color: #1e293b; margin-bottom: 25px; }
  .flow-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .flow-step { flex: 1; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 12px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.03); }
  .step-num { font-size: 11px; font-weight: 700; color: #2563eb; text-transform: uppercase; margin-bottom: 4px; }
  .step-title { font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
  .step-desc { font-size: 11px; color: #64748b; line-height: 1.4; }
  .arrow { font-size: 20px; font-weight: bold; color: #94a3b8; padding: 0 10px; }
  .highlight-step { border-color: #2563eb; background: #eff6ff; }
  .security-step { border-color: #059669; background: #ecfdf5; }
</style>
</head>
<body>
<div class="canvas">
  <div class="title">Resume Intelligence (RI-3) Ingestion, Deduplication & Atomic Persistence Architecture</div>
  
  <div class="flow-row">
    <div class="flow-step">
      <div class="step-num">Step 1: Document Upload</div>
      <div class="step-title">Resume Submission</div>
      <div class="step-desc">Candidate uploads PDF or DOCX file (up to 10MB) via React Dropzone</div>
    </div>
    <div class="arrow">➔</div>
    <div class="flow-step">
      <div class="step-num">Step 2: Stream Extraction</div>
      <div class="step-title">Text Stream Extraction</div>
      <div class="step-desc">Apache PDFBox 3.0 / POI 5.4 parses text without cloud storage leakage</div>
    </div>
    <div class="arrow">➔</div>
    <div class="flow-step">
      <div class="step-num">Step 3: Section Parser</div>
      <div class="step-title">Deterministic Parsing</div>
      <div class="step-desc">Regex & Section Header matching isolates personal, skills, edu, exp, certs</div>
    </div>
  </div>

  <div class="flow-row">
    <div class="flow-step highlight-step">
      <div class="step-num">Step 4: Candidate Draft Review</div>
      <div class="step-title">Granular Selection & Editing</div>
      <div class="step-desc">User edits fields, selects/unchecks individual items, reviews privacy badge</div>
    </div>
    <div class="arrow">➔</div>
    <div class="flow-step security-step">
      <div class="step-num">Step 5: Overwrite Consent</div>
      <div class="step-title">Explicit Authorization</div>
      <div class="step-desc">Personal details require explicit checkbox approval before updating profile</div>
    </div>
    <div class="arrow">➔</div>
    <div class="flow-step">
      <div class="step-num">Step 6: REST Submission</div>
      <div class="step-title">POST /resume/import</div>
      <div class="step-desc">Transmits structured JSON DTO carrying modified values & selected flags</div>
    </div>
  </div>

  <div class="flow-row">
    <div class="flow-step security-step">
      <div class="step-num">Step 7: Pre-Validation</div>
      <div class="step-title">Identity & Profile Check</div>
      <div class="step-desc">Validates JWT principal against CandidateProfile; ensures atomic integrity</div>
    </div>
    <div class="arrow">➔</div>
    <div class="flow-step highlight-step">
      <div class="step-num">Step 8: 5-Field Deduplication</div>
      <div class="step-title">Temporal Key Matching</div>
      <div class="step-desc">Checks institution+degree+field+dates; protects repeated legitimate records</div>
    </div>
    <div class="arrow">➔</div>
    <div class="flow-step security-step">
      <div class="step-num">Step 9: Atomic JPA Persistence</div>
      <div class="step-title">Transactional Ingestion</div>
      <div class="step-desc">@Transactional commits new entities, updates Profile Strength Meter (85-100%)</div>
    </div>
  </div>
</div>
</body>
</html>
"""

# Write HTML files
with open('report_assets/diagrams/er_diagram.html', 'w', encoding='utf-8') as f:
    f.write(html_er)
with open('report_assets/diagrams/usecase_diagram.html', 'w', encoding='utf-8') as f:
    f.write(html_usecase)
with open('report_assets/diagrams/ri3_flowchart.html', 'w', encoding='utf-8') as f:
    f.write(html_ri3)

options = Options()
options.add_argument('--headless=new')
options.add_argument('--window-size=1200,850')
driver = webdriver.Chrome(options=options)

try:
    # 4. ER Diagram
    driver.get('file:///' + os.path.abspath('report_assets/diagrams/er_diagram.html').replace('\\', '/'))
    time.sleep(1)
    driver.save_screenshot('report_assets/diagrams/fig_er_diagram.png')
    
    # 5. Use Case Diagram
    driver.get('file:///' + os.path.abspath('report_assets/diagrams/usecase_diagram.html').replace('\\', '/'))
    time.sleep(1)
    driver.save_screenshot('report_assets/diagrams/fig_usecase_diagram.png')
    
    # 6. RI-3 Flowchart
    driver.get('file:///' + os.path.abspath('report_assets/diagrams/ri3_flowchart.html').replace('\\', '/'))
    time.sleep(1)
    driver.save_screenshot('report_assets/diagrams/fig_ri3_flowchart.png')
    
    print("All additional academic diagrams generated successfully!")
finally:
    driver.quit()
