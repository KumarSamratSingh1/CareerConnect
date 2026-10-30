package com.careerconnect.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.dao.DataIntegrityViolationException;

import com.careerconnect.backend.common.enums.Role;
import com.careerconnect.backend.dto.request.CompanyRequest;
import com.careerconnect.backend.dto.response.CompanyResponse;
import com.careerconnect.backend.entity.Company;
import com.careerconnect.backend.entity.RecruiterProfile;
import com.careerconnect.backend.entity.User;
import com.careerconnect.backend.exception.DuplicateResourceException;
import com.careerconnect.backend.exception.ResourceNotFoundException;
import com.careerconnect.backend.repository.CompanyRepository;
import com.careerconnect.backend.repository.RecruiterProfileRepository;

class CompanyServiceTests {

	private CurrentUserService currentUserService;
	private RecruiterProfileRepository recruiterProfileRepository;
	private CompanyRepository companyRepository;
	private CompanyService service;

	@BeforeEach
	void setUp() {
		currentUserService = Mockito.mock(CurrentUserService.class);
		recruiterProfileRepository = Mockito.mock(RecruiterProfileRepository.class);
		companyRepository = Mockito.mock(CompanyRepository.class);
		service = new CompanyService(currentUserService, recruiterProfileRepository, companyRepository);
	}

	@Test
	void recruiterWithoutProfileCannotCreateCompany() {
		when(currentUserService.getCurrentUser()).thenReturn(recruiter(1L));
		when(recruiterProfileRepository.findByUserId(1L)).thenReturn(Optional.empty());

		assertThrows(ResourceNotFoundException.class, () -> service.createCompany(companyRequest("Acme")));
		verify(companyRepository, never()).saveAndFlush(any());
	}

	@Test
	void recruiterCanCreateCompany() {
		RecruiterProfile profile = profile(1L);
		when(currentUserService.getCurrentUser()).thenReturn(recruiter(1L));
		when(recruiterProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
		when(companyRepository.saveAndFlush(any(Company.class))).thenAnswer(invocation -> {
			Company company = invocation.getArgument(0);
			company.setId(10L);
			company.setVerified(false);
			return company;
		});
		when(recruiterProfileRepository.saveAndFlush(profile)).thenReturn(profile);

		CompanyResponse response = service.createCompany(companyRequest("Acme"));

		assertEquals(10L, response.id());
		assertEquals("Acme", profile.getCompany().getName());
		assertFalse(response.verified());
	}

	@Test
	void recruiterCannotCreateSecondCompany() {
		RecruiterProfile profile = profile(1L);
		profile.setCompany(company(10L, "Acme", false));
		when(currentUserService.getCurrentUser()).thenReturn(recruiter(1L));
		when(recruiterProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));

		assertThrows(DuplicateResourceException.class, () -> service.createCompany(companyRequest("Other")));
		verify(companyRepository, never()).saveAndFlush(any());
	}

	@Test
	void recruiterCanGetOwnCompany() {
		RecruiterProfile profile = profile(1L);
		profile.setCompany(company(10L, "Acme", false));
		when(currentUserService.getCurrentUser()).thenReturn(recruiter(1L));
		when(recruiterProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));

		CompanyResponse response = service.getMyCompany();

		assertEquals(10L, response.id());
		assertEquals("Acme", response.name());
	}

	@Test
	void recruiterCanUpdateOwnCompanyWithoutChangingVerifiedStatus() {
		RecruiterProfile profile = profile(1L);
		Company company = company(10L, "Acme", true);
		profile.setCompany(company);
		when(currentUserService.getCurrentUser()).thenReturn(recruiter(1L));
		when(recruiterProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
		when(companyRepository.save(company)).thenReturn(company);

		CompanyResponse response = service.updateMyCompany(companyRequest("Updated Acme"));

		assertEquals("Updated Acme", response.name());
		assertEquals(true, response.verified());
	}

	@Test
	void companyRelationshipUniqueConstraintIsReportedAsDuplicate() {
		RecruiterProfile profile = profile(1L);
		when(currentUserService.getCurrentUser()).thenReturn(recruiter(1L));
		when(recruiterProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
		when(companyRepository.saveAndFlush(any(Company.class))).thenAnswer(invocation -> invocation.getArgument(0));
		when(recruiterProfileRepository.saveAndFlush(profile))
				.thenThrow(new DataIntegrityViolationException("duplicate company_id"));

		assertThrows(DuplicateResourceException.class, () -> service.createCompany(companyRequest("Acme")));
	}

	private User recruiter(Long id) {
		User user = new User();
		user.setId(id);
		user.setRole(Role.RECRUITER);
		return user;
	}

	private RecruiterProfile profile(Long userId) {
		RecruiterProfile profile = new RecruiterProfile();
		profile.setId(userId * 10);
		profile.setUser(recruiter(userId));
		return profile;
	}

	private Company company(Long id, String name, boolean verified) {
		Company company = new Company();
		company.setId(id);
		company.setName(name);
		company.setLocation("Remote");
		company.setIndustry("Technology");
		company.setVerified(verified);
		return company;
	}

	private CompanyRequest companyRequest(String name) {
		CompanyRequest request = new CompanyRequest();
		request.setName(name);
		request.setDescription("Company description");
		request.setWebsite("https://example.com");
		request.setLocation("Remote");
		request.setIndustry("Technology");
		return request;
	}
}
