package com.careerconnect.backend.config;

import java.time.LocalDate;
import java.util.Locale;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.careerconnect.backend.common.enums.EmploymentType;
import com.careerconnect.backend.common.enums.JobStatus;
import com.careerconnect.backend.common.enums.JobType;
import com.careerconnect.backend.common.enums.Role;
import com.careerconnect.backend.entity.CandidateProfile;
import com.careerconnect.backend.entity.Company;
import com.careerconnect.backend.entity.Job;
import com.careerconnect.backend.entity.RecruiterProfile;
import com.careerconnect.backend.entity.User;
import com.careerconnect.backend.repository.CandidateProfileRepository;
import com.careerconnect.backend.repository.CompanyRepository;
import com.careerconnect.backend.repository.JobRepository;
import com.careerconnect.backend.repository.RecruiterProfileRepository;
import com.careerconnect.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Seeds default development/evaluator demo accounts if not already present.
 * Provides functional Candidate, Recruiter, and Admin accounts with required profiles
 * so that candidate apply/save workflows can be tested immediately.
 */
@Component
@ConditionalOnProperty(name = "app.seeder.demo.enabled", havingValue = "true", matchIfMissing = true)
@Order(10)
@RequiredArgsConstructor
@Slf4j
public class DemoDataSeeder implements CommandLineRunner {

	public static final String CANDIDATE_EMAIL = "candidate@careerconnect.com";
	public static final String RECRUITER_EMAIL = "recruiter@techcorp.com";
	public static final String ADMIN_EMAIL = "admin@careerconnect.com";
	public static final String DEFAULT_PASSWORD = "Password123!";

	private final UserRepository userRepository;
	private final CandidateProfileRepository candidateProfileRepository;
	private final CompanyRepository companyRepository;
	private final RecruiterProfileRepository recruiterProfileRepository;
	private final JobRepository jobRepository;
	private final PasswordEncoder passwordEncoder;

	@Override
	@Transactional
	public void run(String... args) {
		seedCandidate();
		seedRecruiterAndJob();
		seedAdmin();
	}

	private void seedCandidate() {
		String email = CANDIDATE_EMAIL.toLowerCase(Locale.ROOT);
		User user = userRepository.findByEmail(email).orElse(null);
		if (user == null) {
			User newUser = new User();
			newUser.setEmail(email);
			newUser.setPassword(passwordEncoder.encode(DEFAULT_PASSWORD));
			newUser.setRole(Role.CANDIDATE);
			newUser.setEnabled(true);
			User saved = userRepository.save(newUser);
			user = saved != null ? saved : newUser;
			log.info("Seeded demo candidate account: {}", email);
		} else {
			user.setPassword(passwordEncoder.encode(DEFAULT_PASSWORD));
			user.setRole(Role.CANDIDATE);
			user.setEnabled(true);
			userRepository.save(user);
			log.info("Synchronized demo candidate password: {}", email);
		}

		if (user.getId() != null && !candidateProfileRepository.existsByUserId(user.getId())) {
			CandidateProfile profile = new CandidateProfile();
			profile.setUser(user);
			profile.setFullName("Alex Johnson");
			profile.setPhone("+91 98765 43210");
			profile.setResumeUrl("https://example.com/resumes/alex-johnson.pdf");
			candidateProfileRepository.save(profile);
			log.info("Seeded candidate profile for: {}", email);
		}
	}

	private void seedRecruiterAndJob() {
		String email = RECRUITER_EMAIL.toLowerCase(Locale.ROOT);
		User recruiter = userRepository.findByEmail(email).orElse(null);
		if (recruiter == null) {
			User newRecruiter = new User();
			newRecruiter.setEmail(email);
			newRecruiter.setPassword(passwordEncoder.encode(DEFAULT_PASSWORD));
			newRecruiter.setRole(Role.RECRUITER);
			newRecruiter.setEnabled(true);
			User saved = userRepository.save(newRecruiter);
			recruiter = saved != null ? saved : newRecruiter;
			log.info("Seeded demo recruiter account: {}", email);
		} else {
			recruiter.setPassword(passwordEncoder.encode(DEFAULT_PASSWORD));
			recruiter.setRole(Role.RECRUITER);
			recruiter.setEnabled(true);
			userRepository.save(recruiter);
			log.info("Synchronized demo recruiter password: {}", email);
		}

		Company company = companyRepository.findByName("TechCorp Solutions").orElse(null);
		if (company == null) {
			Company newCompany = new Company();
			newCompany.setName("TechCorp Solutions");
			newCompany.setDescription("Enterprise cloud software, scalable web services, and high-performance digital platforms.");
			newCompany.setWebsite("https://techcorp.example.com");
			newCompany.setLocation("Bangalore, India");
			newCompany.setIndustry("Information Technology & Software");
			newCompany.setVerified(true);
			Company saved = companyRepository.save(newCompany);
			company = saved != null ? saved : newCompany;
			log.info("Seeded demo company: TechCorp Solutions");
		}

		if (recruiter.getId() != null && !recruiterProfileRepository.existsByUserId(recruiter.getId())) {
			RecruiterProfile profile = new RecruiterProfile();
			profile.setUser(recruiter);
			profile.setFullName("Sarah Jenkins");
			profile.setPhone("+91 98765 12345");
			profile.setDesignation("Lead Talent Partner");
			profile.setCompany(company);
			recruiterProfileRepository.save(profile);
			log.info("Seeded recruiter profile for: {}", email);
		}

		if (jobRepository.count() == 0) {
			Job job = new Job();
			job.setCompany(company);
			job.setTitle("Senior Full Stack Engineer");
			job.setDescription("TechCorp Solutions is seeking an experienced Full Stack Engineer to lead core application architecture. You will design resilient Spring Boot microservices, build responsive React interfaces, and collaborate with high-performance engineering teams.");
			job.setLocation("Bangalore, India");
			job.setJobType(JobType.JOB);
			job.setEmploymentType(EmploymentType.FULL_TIME);
			job.setMinSalary(1800000);
			job.setMaxSalary(2600000);
			job.setMinExperience(4);
			job.setStatus(JobStatus.OPEN);
			job.setApplicationDeadline(LocalDate.now().plusMonths(3));
			jobRepository.save(job);
			log.info("Seeded demo open job: Senior Full Stack Engineer");
		}
	}

	private void seedAdmin() {
		String email = ADMIN_EMAIL.toLowerCase(Locale.ROOT);
		User admin = userRepository.findByEmail(email).orElse(null);
		if (admin == null) {
			User newAdmin = new User();
			newAdmin.setEmail(email);
			newAdmin.setPassword(passwordEncoder.encode(DEFAULT_PASSWORD));
			newAdmin.setRole(Role.ADMIN);
			newAdmin.setEnabled(true);
			userRepository.save(newAdmin);
			log.info("Seeded demo admin account: {}", email);
		} else {
			admin.setPassword(passwordEncoder.encode(DEFAULT_PASSWORD));
			admin.setRole(Role.ADMIN);
			admin.setEnabled(true);
			userRepository.save(admin);
			log.info("Synchronized demo admin account password: {}", email);
		}
	}
}
