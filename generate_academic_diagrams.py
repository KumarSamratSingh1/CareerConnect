import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

os.makedirs('report_assets/diagrams', exist_ok=True)

# 1. Graphical Abstract HTML
html_graphical_abstract = """<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #f8fafc; display: flex; justify-content: center; }
  .canvas { width: 1100px; padding: 30px; background: #1e293b; border-radius: 16px; border: 1px solid #334155; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
  .header { text-align: center; margin-bottom: 25px; }
  .title { font-size: 24px; font-weight: 700; color: #38bdf8; letter-spacing: 0.5px; }
  .subtitle { font-size: 14px; color: #94a3b8; margin-top: 5px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 25px; }
  .role-card { background: #0f172a; border-radius: 12px; padding: 18px; border-top: 4px solid #38bdf8; }
  .role-card.cand { border-top-color: #38bdf8; }
  .role-card.rec { border-top-color: #34d399; }
  .role-card.adm { border-top-color: #fbbf24; }
  .role-title { font-size: 16px; font-weight: 700; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
  .role-card.cand .role-title { color: #38bdf8; }
  .role-card.rec .role-title { color: #34d399; }
  .role-card.adm .role-title { color: #fbbf24; }
  .feature-list { list-style: none; padding: 0; margin: 0; font-size: 12.5px; color: #cbd5e1; line-height: 1.6; }
  .feature-list li::before { content: "✓ "; color: #38bdf8; font-weight: bold; }
  .role-card.rec .feature-list li::before { color: #34d399; }
  .role-card.adm .feature-list li::before { color: #fbbf24; }
  
  .middle-band { background: linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(129, 140, 248, 0.1)); border: 1px solid #6366f1; border-radius: 12px; padding: 18px; margin-bottom: 25px; text-align: center; }
  .engine-title { font-size: 16px; font-weight: 700; color: #818cf8; margin-bottom: 8px; }
  .engine-desc { font-size: 12.5px; color: #cbd5e1; max-width: 900px; margin: 0 auto; line-height: 1.5; }
  .flow-pills { display: flex; justify-content: center; gap: 12px; margin-top: 14px; flex-wrap: wrap; }
  .pill { background: #1e1b4b; border: 1px solid #818cf8; color: #c7d2fe; padding: 6px 14px; border-radius: 20px; font-size: 11.5px; font-weight: 600; }
  
  .bottom-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
  .tech-card { background: #0f172a; border-radius: 12px; padding: 18px; border: 1px solid #334155; }
  .tech-title { font-size: 15px; font-weight: 700; color: #f1f5f9; margin-bottom: 10px; }
  .tech-tags { display: flex; flex-wrap: wrap; gap: 8px; }
  .tech-tag { background: #1e293b; color: #94a3b8; border: 1px solid #475569; padding: 4px 10px; border-radius: 6px; font-size: 11.5px; font-weight: 500; }
  .highlight { color: #38bdf8; border-color: #38bdf8; background: rgba(56, 189, 248, 0.1); }
</style>
</head>
<body>
<div class="canvas">
  <div class="header">
    <div class="title">CareerConnect: Smart Recruitment & Career Intelligence Platform</div>
    <div class="subtitle">Full-Stack Enterprise Architecture with Role-Based Access Control and Resume Intelligence (RI-3)</div>
  </div>
  
  <div class="grid">
    <div class="role-card cand">
      <div class="role-title">👤 Candidate Ecosystem</div>
      <ul class="feature-list">
        <li>Rich Profile Management & Strength Meter</li>
        <li>Resume Upload & Intelligent Extraction</li>
        <li>Granular Review & Approved Import</li>
        <li>Smart Job Discovery & Multi-Filter Search</li>
        <li>Single-Click Job Applications & Withdrawal</li>
        <li>Interview Schedule & Calendar Tracking</li>
      </ul>
    </div>
    
    <div class="role-card rec">
      <div class="role-title">🏢 Recruiter Management Hub</div>
      <ul class="feature-list">
        <li>Verified Corporate Profile Management</li>
        <li>Targeted Job & Internship Publishing</li>
        <li>Applicant Review & Qualification Scoring</li>
        <li>Application Lifecycle Transitions</li>
        <li>Built-in Interview Scheduling & Links</li>
        <li>Real-Time Candidate Pipeline Analytics</li>
      </ul>
    </div>
    
    <div class="role-card adm">
      <div class="role-title">🛡️ Admin Governance Console</div>
      <ul class="feature-list">
        <li>System Telemetry & Platform Counters</li>
        <li>User Directory Audit & Suspension Controls</li>
        <li>Corporate Verification Audit (KYC)</li>
        <li>Marketplace Job Listing Moderation</li>
        <li>Cross-Platform Interview Inspection</li>
        <li>Compliance & Account Activity Logging</li>
      </ul>
    </div>
  </div>
  
  <div class="middle-band">
    <div class="engine-title">⚡ Intelligent Resume Parsing & Ingestion Engine (RI-3)</div>
    <div class="engine-desc">
      Processes multi-format resume documents (PDF, DOCX) through Apache PDFBox/POI text extractors, applies deterministic pattern matching with 5-field temporal composite deduplication, enforces explicit overwrite approval, and performs isolated transactional persistence.
    </div>
    <div class="flow-pills">
      <div class="pill">📄 PDF / DOCX Upload</div>
      <div class="pill">⚙️ Text Extraction</div>
      <div class="pill">🔍 Section Parsing</div>
      <div class="pill">✏️ Candidate Review Draft</div>
      <div class="pill">🛡️ Overwrite Authorization</div>
      <div class="pill">💾 Atomic JPA Persistence</div>
    </div>
  </div>
  
  <div class="bottom-grid">
    <div class="tech-card">
      <div class="tech-title">💻 Technical Stack & Modern Tooling</div>
      <div class="tech-tags">
        <span class="tech-tag highlight">Java 21</span>
        <span class="tech-tag highlight">Spring Boot 4.1.1</span>
        <span class="tech-tag highlight">Spring Security 6</span>
        <span class="tech-tag highlight">JWT (JJWT 0.12.6)</span>
        <span class="tech-tag highlight">Spring Data JPA</span>
        <span class="tech-tag highlight">MySQL 8.0</span>
        <span class="tech-tag highlight">React 19</span>
        <span class="tech-tag highlight">Vite 8</span>
        <span class="tech-tag highlight">React Router 7</span>
        <span class="tech-tag highlight">Axios</span>
        <span class="tech-tag highlight">Apache PDFBox 3.0</span>
        <span class="tech-tag highlight">Apache POI 5.4</span>
        <span class="tech-tag highlight">JUnit 5 / Mockito</span>
      </div>
    </div>
    
    <div class="tech-card">
      <div class="tech-title">📊 Verification Metrics</div>
      <div style="font-size: 13px; color: #cbd5e1; line-height: 1.8;">
        <div>• <strong>Automated Tests:</strong> 146 / 146 Passed (100%)</div>
        <div>• <strong>Frontend Linting:</strong> 0 Errors / 0 Warnings</div>
        <div>• <strong>Database Entities:</strong> 13 Relational Tables</div>
        <div>• <strong>Security:</strong> Stateless JWT RBAC</div>
      </div>
    </div>
  </div>
</div>
</body>
</html>
"""

# 2. System Architecture HTML
html_sys_arch = """<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #ffffff; color: #0f172a; display: flex; justify-content: center; }
  .canvas { width: 1050px; padding: 25px; border: 2px solid #e2e8f0; border-radius: 12px; background: #fafafa; }
  .title { text-align: center; font-size: 22px; font-weight: 700; color: #1e293b; margin-bottom: 25px; }
  .layer { background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 15px; margin-bottom: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
  .layer-header { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
  .layer-1 .layer-header { color: #2563eb; }
  .layer-2 .layer-header { color: #059669; }
  .layer-3 .layer-header { color: #7c3aed; }
  .layer-4 .layer-header { color: #d97706; }
  .layer-5 .layer-header { color: #dc2626; }
  .components { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; }
  .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; text-align: center; }
  .box-name { font-size: 13px; font-weight: 600; color: #0f172a; }
  .box-desc { font-size: 11px; color: #64748b; margin-top: 3px; }
  .connector { text-align: center; font-size: 18px; color: #94a3b8; margin: -8px 0 8px; font-weight: bold; }
</style>
</head>
<body>
<div class="canvas">
  <div class="title">CareerConnect 3-Tier Layered Architecture</div>
  
  <div class="layer layer-1">
    <div class="layer-header">
      <span>1. Presentation Layer (Client Side)</span>
      <span style="font-size: 11px; background: #dbeafe; padding: 3px 8px; border-radius: 4px;">React 19 + Vite 8 SPA</span>
    </div>
    <div class="components">
      <div class="box"><div class="box-name">Candidate Portal</div><div class="box-desc">Dashboard, Profile, Resume Import, Saved Jobs</div></div>
      <div class="box"><div class="box-name">Recruiter Hub</div><div class="box-desc">Company, Job Postings, Application Review</div></div>
      <div class="box"><div class="box-name">Admin Console</div><div class="box-desc">User Management, Verification, Telemetry</div></div>
      <div class="box"><div class="box-name">Public Marketplace</div><div class="box-desc">Home, Search, Details, Auth Pages</div></div>
      <div class="box"><div class="box-name">Route Guards & Context</div><div class="box-desc">ProtectedRoute, AuthContext, ThemeContext</div></div>
    </div>
  </div>
  
  <div class="connector">▼ HTTP / REST APIs (JSON & Multipart via Axios with JWT Bearer Interceptor) ▼</div>
  
  <div class="layer layer-2">
    <div class="layer-header">
      <span>2. Security & Gateway Filter Layer</span>
      <span style="font-size: 11px; background: #d1fae5; padding: 3px 8px; border-radius: 4px;">Spring Security 6</span>
    </div>
    <div class="components">
      <div class="box"><div class="box-name">JwtAuthFilter</div><div class="box-desc">Header Token Extraction & Validation</div></div>
      <div class="box"><div class="box-name">SecurityContextHolder</div><div class="box-desc">Stateless Principal & Role Context</div></div>
      <div class="box"><div class="box-name">CORS Configuration</div><div class="box-desc">Allowed Origins & Pre-flight Handlers</div></div>
      <div class="box"><div class="box-name">Role-Based URL Matchers</div><div class="box-desc">hasRole('CANDIDATE' / 'RECRUITER' / 'ADMIN')</div></div>
    </div>
  </div>
  
  <div class="connector">▼ Authorized Requests ▼</div>
  
  <div class="layer layer-3">
    <div class="layer-header">
      <span>3. Application Controller & DTO Layer</span>
      <span style="font-size: 11px; background: #ede9fe; padding: 3px 8px; border-radius: 4px;">Spring Web MVC</span>
    </div>
    <div class="components">
      <div class="box"><div class="box-name">AuthController</div><div class="box-desc">Register, Login, Google OAuth</div></div>
      <div class="box"><div class="box-name">CandidateControllers</div><div class="box-desc">Profile, Education, Experience, Skills</div></div>
      <div class="box"><div class="box-name">ResumeController</div><div class="box-desc">/resume/parse & /resume/import</div></div>
      <div class="box"><div class="box-name">RecruiterControllers</div><div class="box-desc">Jobs, Applications, Company, Interview</div></div>
      <div class="box"><div class="box-name">AdminControllers</div><div class="box-desc">Dashboard, Users, Companies, Moderation</div></div>
    </div>
  </div>
  
  <div class="connector">▼ Service Invocation & Bean Validation ▼</div>
  
  <div class="layer layer-4">
    <div class="layer-header">
      <span>4. Business Logic & Processing Layer</span>
      <span style="font-size: 11px; background: #fef3c7; padding: 3px 8px; border-radius: 4px;">Spring Service Layer</span>
    </div>
    <div class="components">
      <div class="box"><div class="box-name">ResumeImportService</div><div class="box-desc">Pre-Validation & 5-Field Deduplication</div></div>
      <div class="box"><div class="box-name">DocumentParserService</div><div class="box-desc">PDFBox & POI Text Extraction</div></div>
      <div class="box"><div class="box-name">ApplicationService</div><div class="box-desc">State Transitions & Status History</div></div>
      <div class="box"><div class="box-name">InterviewService</div><div class="box-desc">Meeting Links & Schedule Coordination</div></div>
      <div class="box"><div class="box-name">JobExpiryScheduler</div><div class="box-desc">Automated Deadline Cleanup Cron</div></div>
    </div>
  </div>
  
  <div class="connector">▼ Transactional Persistence (Spring Data JPA) ▼</div>
  
  <div class="layer layer-5">
    <div class="layer-header">
      <span>5. Data Persistence Layer</span>
      <span style="font-size: 11px; background: #fee2e2; padding: 3px 8px; border-radius: 4px;">Hibernate ORM & MySQL 8.0</span>
    </div>
    <div class="components">
      <div class="box"><div class="box-name">User & Profile Tables</div><div class="box-desc">users, candidate_profiles, recruiter_profiles</div></div>
      <div class="box"><div class="box-name">Candidate Portfolio</div><div class="box-desc">educations, experiences, skills, projects, certs</div></div>
      <div class="box"><div class="box-name">Recruitment Tables</div><div class="box-desc">companies, jobs, applications, status_history</div></div>
      <div class="box"><div class="box-name">Interviews & Bookmarks</div><div class="box-desc">interviews, saved_jobs, candidate_skills</div></div>
    </div>
  </div>
</div>
</body>
</html>
"""

# 3. Gantt Chart HTML
html_gantt = """<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #ffffff; color: #0f172a; display: flex; justify-content: center; }
  .canvas { width: 1050px; padding: 25px; border: 2px solid #e2e8f0; border-radius: 12px; background: #ffffff; }
  .title { text-align: center; font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #cbd5e1; padding: 8px 6px; text-align: center; }
  th { background: #f1f5f9; color: #1e293b; font-weight: 600; }
  td.task { text-align: left; font-weight: 600; color: #334155; width: 280px; }
  .bar { height: 16px; border-radius: 4px; }
  .bar-plan { background: #38bdf8; }
  .bar-design { background: #818cf8; }
  .bar-back { background: #34d399; }
  .bar-front { background: #f59e0b; }
  .bar-ri3 { background: #ec4899; }
  .bar-test { background: #10b981; }
  .bar-doc { background: #64748b; }
  .legend { display: flex; justify-content: center; gap: 15px; margin-top: 20px; flex-wrap: wrap; font-size: 11.5px; }
  .legend-item { display: flex; align-items: center; gap: 6px; }
  .legend-color { width: 14px; height: 14px; border-radius: 3px; }
</style>
</head>
<body>
<div class="canvas">
  <div class="title">CareerConnect Project Development Timeline (Gantt Chart)</div>
  <table>
    <thead>
      <tr>
        <th rowspan="2">Phase / Task Description</th>
        <th colspan="4">Month 1</th>
        <th colspan="4">Month 2</th>
        <th colspan="4">Month 3</th>
      </tr>
      <tr>
        <th>W1</th><th>W2</th><th>W3</th><th>W4</th>
        <th>W5</th><th>W6</th><th>W7</th><th>W8</th>
        <th>W9</th><th>W10</th><th>W11</th><th>W12</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="task">1. Client Need Analysis & Feasibility Study</td>
        <td><div class="bar bar-plan"></div></td><td><div class="bar bar-plan"></div></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
      </tr>
      <tr>
        <td class="task">2. Architecture & Relational Schema Design</td>
        <td></td><td><div class="bar bar-design"></div></td><td><div class="bar bar-design"></div></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
      </tr>
      <tr>
        <td class="task">3. Backend Auth, Security & REST APIs</td>
        <td></td><td></td><td><div class="bar bar-back"></div></td><td><div class="bar bar-back"></div></td><td><div class="bar bar-back"></div></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
      </tr>
      <tr>
        <td class="task">4. Frontend UI Components & Role Portals</td>
        <td></td><td></td><td></td><td></td><td><div class="bar bar-front"></div></td><td><div class="bar bar-front"></div></td><td><div class="bar bar-front"></div></td><td></td><td></td><td></td><td></td><td></td>
      </tr>
      <tr>
        <td class="task">5. Resume Intelligence (RI-3) Engine</td>
        <td></td><td></td><td></td><td></td><td></td><td></td><td><div class="bar bar-ri3"></div></td><td><div class="bar bar-ri3"></div></td><td><div class="bar bar-ri3"></div></td><td></td><td></td><td></td>
      </tr>
      <tr>
        <td class="task">6. End-to-End Integration & Unit Testing</td>
        <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td><div class="bar bar-test"></div></td><td><div class="bar bar-test"></div></td><td><div class="bar bar-test"></div></td><td></td>
      </tr>
      <tr>
        <td class="task">7. Final Academic Report & Verification</td>
        <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td><div class="bar bar-doc"></div></td><td><div class="bar bar-doc"></div></td>
      </tr>
    </tbody>
  </table>
  
  <div class="legend">
    <div class="legend-item"><div class="legend-color bar-plan"></div><span>Need Identification</span></div>
    <div class="legend-item"><div class="legend-color bar-design"></div><span>Design & Schemas</span></div>
    <div class="legend-item"><div class="legend-color bar-back"></div><span>Backend Engineering</span></div>
    <div class="legend-item"><div class="legend-color bar-front"></div><span>Frontend Engineering</span></div>
    <div class="legend-item"><div class="legend-color bar-ri3"></div><span>Resume Intelligence</span></div>
    <div class="legend-item"><div class="legend-color bar-test"></div><span>Verification & Tests</span></div>
    <div class="legend-item"><div class="legend-color bar-doc"></div><span>Documentation</span></div>
  </div>
</div>
</body>
</html>
"""

# Write files and capture
with open('report_assets/diagrams/graphical_abstract.html', 'w', encoding='utf-8') as f:
    f.write(html_graphical_abstract)
with open('report_assets/diagrams/sys_arch.html', 'w', encoding='utf-8') as f:
    f.write(html_sys_arch)
with open('report_assets/diagrams/gantt.html', 'w', encoding='utf-8') as f:
    f.write(html_gantt)

options = Options()
options.add_argument('--headless=new')
options.add_argument('--window-size=1200,900')
driver = webdriver.Chrome(options=options)

try:
    # 1. Graphical Abstract
    driver.get('file:///' + os.path.abspath('report_assets/diagrams/graphical_abstract.html').replace('\\', '/'))
    time.sleep(1)
    driver.save_screenshot('report_assets/diagrams/fig_graphical_abstract.png')
    
    # 2. System Architecture
    driver.get('file:///' + os.path.abspath('report_assets/diagrams/sys_arch.html').replace('\\', '/'))
    time.sleep(1)
    driver.save_screenshot('report_assets/diagrams/fig_system_architecture.png')
    
    # 3. Gantt Chart
    driver.get('file:///' + os.path.abspath('report_assets/diagrams/gantt.html').replace('\\', '/'))
    time.sleep(1)
    driver.save_screenshot('report_assets/diagrams/fig_gantt_chart.png')
    
    print("Academic diagrams generated successfully!")
finally:
    driver.quit()
