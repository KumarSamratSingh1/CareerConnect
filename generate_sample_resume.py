from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import os

os.makedirs('report_assets', exist_ok=True)
c = canvas.Canvas('report_assets/sample_resume.pdf', pagesize=letter)

# Header
c.setFont("Helvetica-Bold", 18)
c.drawString(50, 750, "Alex Johnson")
c.setFont("Helvetica", 11)
c.drawString(50, 735, "Email: alex@example.com | Phone: +91 98765 43210")
c.drawString(50, 720, "LinkedIn: https://linkedin.com/in/alexjohnson | GitHub: https://github.com/alexjohnson")

# Summary
c.setFont("Helvetica-Bold", 14)
c.drawString(50, 690, "Professional Summary")
c.setFont("Helvetica", 10)
c.drawString(50, 675, "Full stack software engineer with 4+ years experience designing robust distributed systems with Spring Boot and React.")

# Skills
c.setFont("Helvetica-Bold", 14)
c.drawString(50, 645, "Skills")
c.setFont("Helvetica", 10)
c.drawString(50, 630, "Java, Spring Boot, React, Vite, MySQL, REST APIs, Microservices, Docker, Git")

# Experience
c.setFont("Helvetica-Bold", 14)
c.drawString(50, 600, "Experience")
c.setFont("Helvetica-Bold", 11)
c.drawString(50, 585, "TechCorp Solutions - Senior Software Engineer")
c.setFont("Helvetica", 10)
c.drawString(50, 570, "June 2021 - Present")
c.drawString(50, 555, "Led development of scalable RESTful web APIs and interactive React frontends.")

# Education
c.setFont("Helvetica-Bold", 14)
c.drawString(50, 525, "Education")
c.setFont("Helvetica-Bold", 11)
c.drawString(50, 510, "Chandigarh University - Bachelor of Engineering in Computer Science")
c.setFont("Helvetica", 10)
c.drawString(50, 495, "August 2017 - May 2021 | CGPA: 8.9")

# Projects
c.setFont("Helvetica-Bold", 14)
c.drawString(50, 465, "Projects")
c.setFont("Helvetica-Bold", 11)
c.drawString(50, 450, "CareerConnect Job Portal")
c.setFont("Helvetica", 10)
c.drawString(50, 435, "Full-stack smart recruitment platform with role-based JWT auth and resume intelligence.")

# Certifications
c.setFont("Helvetica-Bold", 14)
c.drawString(50, 405, "Certifications")
c.setFont("Helvetica-Bold", 11)
c.drawString(50, 390, "AWS Certified Developer Associate - Amazon Web Services")

c.save()
print("sample_resume.pdf generated successfully!")
