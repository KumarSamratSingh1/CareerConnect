package com.careerconnect.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import com.careerconnect.backend.repository.CandidateProfileRepository;
import com.careerconnect.backend.repository.ApplicationRepository;
import com.careerconnect.backend.repository.ApplicationStatusHistoryRepository;
import com.careerconnect.backend.repository.CompanyRepository;
import com.careerconnect.backend.repository.EducationRepository;
import com.careerconnect.backend.repository.ExperienceRepository;
import com.careerconnect.backend.repository.JobRepository;
import com.careerconnect.backend.repository.InterviewRepository;
import com.careerconnect.backend.repository.RecruiterProfileRepository;
import com.careerconnect.backend.repository.SkillRepository;
import com.careerconnect.backend.repository.ProjectRepository;
import com.careerconnect.backend.repository.CertificationRepository;
import com.careerconnect.backend.repository.SavedJobRepository;
import com.careerconnect.backend.repository.UserRepository;

import org.mockito.Mockito;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import org.springframework.mock.web.MockMultipartFile;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.Mockito.when;

import java.util.Optional;

import com.careerconnect.backend.common.enums.Role;
import com.careerconnect.backend.entity.User;

@SpringBootTest(properties = "app.jwt.secret=MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=")
@AutoConfigureMockMvc
@Import(CareerconnectBackendApplicationTests.TestConfig.class)
class CareerconnectBackendApplicationTests {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private UserRepository userRepository;

	@Test
	void contextLoads() {
	}

	@Test
	void unauthenticatedUserCannotAccessProtectedEndpoints() throws Exception {
		mockMvc.perform(get("/api/v1/candidate/profile"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	@WithMockUser(roles = "CANDIDATE")
	void candidateCannotAccessRecruiterProfileEndpoints() throws Exception {
		mockMvc.perform(get("/api/v1/recruiter/profile"))
				.andExpect(status().isForbidden());
	}

	@Test
	@WithMockUser(roles = "CANDIDATE")
	void candidateCannotAccessRecruiterCompanyEndpoints() throws Exception {
		mockMvc.perform(get("/api/v1/recruiter/company"))
				.andExpect(status().isForbidden());
	}

	@Test
	@WithMockUser(roles = "CANDIDATE")
	void candidateCannotAccessRecruiterJobManagementEndpoints() throws Exception {
		mockMvc.perform(get("/api/v1/recruiter/jobs"))
				.andExpect(status().isForbidden());
	}

	@Test
	@WithMockUser(roles = "CANDIDATE")
	void candidateCannotAccessRecruiterApplicationEndpoints() throws Exception {
		mockMvc.perform(get("/api/v1/recruiter/applications/1"))
				.andExpect(status().isForbidden());
	}

	@Test
	@WithMockUser(roles = "CANDIDATE")
	void candidateCannotAccessRecruiterInterviewEndpoints() throws Exception {
		mockMvc.perform(get("/api/v1/recruiter/interviews"))
				.andExpect(status().isForbidden());
	}

	@Test
	@WithMockUser(roles = "CANDIDATE")
	void candidateCannotAccessAdminEndpoints() throws Exception {
		mockMvc.perform(get("/api/v1/admin/dashboard"))
				.andExpect(status().isForbidden());
	}

	@Test
	@WithMockUser(roles = "RECRUITER")
	void recruiterCannotAccessCandidateApplicationOrSavedJobEndpoints() throws Exception {
		mockMvc.perform(get("/api/v1/candidate/applications"))
				.andExpect(status().isForbidden());
		mockMvc.perform(get("/api/v1/candidate/saved-jobs"))
				.andExpect(status().isForbidden());
	}

	@Test
	@WithMockUser(roles = "RECRUITER")
	void recruiterCannotAccessCandidateProfileEndpoints() throws Exception {
		mockMvc.perform(get("/api/v1/candidate/profile"))
				.andExpect(status().isForbidden());
	}

	@Test
	@WithMockUser(roles = "RECRUITER")
	void recruiterCannotAccessCandidateInterviewEndpoints() throws Exception {
		mockMvc.perform(get("/api/v1/candidate/interviews"))
				.andExpect(status().isForbidden());
	}

	@Test
	@WithMockUser(roles = "RECRUITER")
	void recruiterCannotAccessAdminEndpoints() throws Exception {
		mockMvc.perform(get("/api/v1/admin/dashboard"))
				.andExpect(status().isForbidden());
	}

	@Test
	@WithMockUser(username = "admin@example.com", roles = "ADMIN")
	void adminCanAccessDashboard() throws Exception {
		User admin = new User();
		admin.setId(1L);
		admin.setEmail("admin@example.com");
		admin.setRole(Role.ADMIN);
		admin.setEnabled(true);
		when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));

		mockMvc.perform(get("/api/v1/admin/dashboard"))
				.andExpect(status().isOk());
	}

	@Test
	void unauthenticatedUserCannotApplyForJob() throws Exception {
		mockMvc.perform(post("/api/v1/candidate/jobs/1/apply")
				.contentType(org.springframework.http.MediaType.APPLICATION_JSON)
				.content("{\"coverLetter\":\"Test cover letter\"}"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void unauthenticatedUserCannotSaveJob() throws Exception {
		mockMvc.perform(post("/api/v1/candidate/jobs/1/save"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	@WithMockUser(roles = "RECRUITER")
	void recruiterCannotApplyForJob() throws Exception {
		mockMvc.perform(post("/api/v1/candidate/jobs/1/apply")
				.contentType(org.springframework.http.MediaType.APPLICATION_JSON)
				.content("{\"coverLetter\":\"Test cover letter\"}"))
				.andExpect(status().isForbidden());
	}

	@Test
	@WithMockUser(roles = "ADMIN")
	void adminCannotApplyForJob() throws Exception {
		mockMvc.perform(post("/api/v1/candidate/jobs/1/apply")
				.contentType(org.springframework.http.MediaType.APPLICATION_JSON)
				.content("{\"coverLetter\":\"Test cover letter\"}"))
				.andExpect(status().isForbidden());
	}

	@Test
	@WithMockUser(roles = "RECRUITER")
	void recruiterCannotSaveJob() throws Exception {
		mockMvc.perform(post("/api/v1/candidate/jobs/1/save"))
				.andExpect(status().isForbidden());
	}

	@Test
	@WithMockUser(roles = "ADMIN")
	void adminCannotSaveJob() throws Exception {
		mockMvc.perform(post("/api/v1/candidate/jobs/1/save"))
				.andExpect(status().isForbidden());
	}

	@Test
	void unauthenticatedUserCannotAccessResumeParse() throws Exception {
		MockMultipartFile file = new MockMultipartFile("file", "resume.pdf", "application/pdf", "%PDF-1.4 sample".getBytes());
		mockMvc.perform(multipart("/api/v1/candidate/resume/parse").file(file))
				.andExpect(status().isUnauthorized());
	}

	@Test
	@WithMockUser(roles = "RECRUITER")
	void recruiterCannotAccessResumeParse() throws Exception {
		MockMultipartFile file = new MockMultipartFile("file", "resume.pdf", "application/pdf", "%PDF-1.4 sample".getBytes());
		mockMvc.perform(multipart("/api/v1/candidate/resume/parse").file(file))
				.andExpect(status().isForbidden());
	}

	@Test
	@WithMockUser(roles = "ADMIN")
	void adminCannotAccessResumeParse() throws Exception {
		MockMultipartFile file = new MockMultipartFile("file", "resume.pdf", "application/pdf", "%PDF-1.4 sample".getBytes());
		mockMvc.perform(multipart("/api/v1/candidate/resume/parse").file(file))
				.andExpect(status().isForbidden());
	}

	@Test
	@WithMockUser(username = "candidate@example.com", roles = "CANDIDATE")
	void candidateCanAccessResumeParse() throws Exception {
		User candidate = new User();
		candidate.setId(10L);
		candidate.setEmail("candidate@example.com");
		candidate.setRole(Role.CANDIDATE);
		candidate.setEnabled(true);
		when(userRepository.findByEmail("candidate@example.com")).thenReturn(Optional.of(candidate));

		// Using a minimal valid PDF generated on the fly
		org.apache.pdfbox.pdmodel.PDDocument doc = new org.apache.pdfbox.pdmodel.PDDocument();
		doc.addPage(new org.apache.pdfbox.pdmodel.PDPage());
		java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
		doc.save(baos);
		doc.close();

		MockMultipartFile file = new MockMultipartFile("file", "resume.pdf", "application/pdf", baos.toByteArray());

		mockMvc.perform(multipart("/api/v1/candidate/resume/parse").file(file))
				.andExpect(status().isOk());
	}

	@TestConfiguration
	static class TestConfig {

		@Bean
		UserRepository userRepository() {
			return Mockito.mock(UserRepository.class);
		}

		@Bean
		CandidateProfileRepository candidateProfileRepository() {
			return Mockito.mock(CandidateProfileRepository.class);
		}

		@Bean
		RecruiterProfileRepository recruiterProfileRepository() {
			return Mockito.mock(RecruiterProfileRepository.class);
		}

		@Bean
		EducationRepository educationRepository() {
			return Mockito.mock(EducationRepository.class);
		}

		@Bean
		ExperienceRepository experienceRepository() {
			return Mockito.mock(ExperienceRepository.class);
		}

		@Bean
		SkillRepository skillRepository() {
			return Mockito.mock(SkillRepository.class);
		}

		@Bean
		CompanyRepository companyRepository() {
			return Mockito.mock(CompanyRepository.class);
		}

		@Bean
		JobRepository jobRepository() {
			return Mockito.mock(JobRepository.class);
		}

		@Bean
		InterviewRepository interviewRepository() {
			return Mockito.mock(InterviewRepository.class);
		}

		@Bean
		ApplicationRepository applicationRepository() {
			return Mockito.mock(ApplicationRepository.class);
		}

		@Bean
		ApplicationStatusHistoryRepository applicationStatusHistoryRepository() {
			return Mockito.mock(ApplicationStatusHistoryRepository.class);
		}

		@Bean
		SavedJobRepository savedJobRepository() {
			return Mockito.mock(SavedJobRepository.class);
		}

		@Bean
		ProjectRepository projectRepository() {
			return Mockito.mock(ProjectRepository.class);
		}

		@Bean
		CertificationRepository certificationRepository() {
			return Mockito.mock(CertificationRepository.class);
		}
	}

}
