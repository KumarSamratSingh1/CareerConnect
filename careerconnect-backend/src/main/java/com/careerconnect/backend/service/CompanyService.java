package com.careerconnect.backend.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.careerconnect.backend.common.enums.Role;
import com.careerconnect.backend.dto.request.CompanyRequest;
import com.careerconnect.backend.dto.response.CompanyResponse;
import com.careerconnect.backend.entity.Company;
import com.careerconnect.backend.entity.RecruiterProfile;
import com.careerconnect.backend.entity.User;
import com.careerconnect.backend.exception.DuplicateResourceException;
import com.careerconnect.backend.exception.ResourceNotFoundException;
import com.careerconnect.backend.exception.UnauthorizedActionException;
import com.careerconnect.backend.repository.CompanyRepository;
import com.careerconnect.backend.repository.RecruiterProfileRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CompanyService {

	private final CurrentUserService currentUserService;
	private final RecruiterProfileRepository recruiterProfileRepository;
	private final CompanyRepository companyRepository;

	@Transactional
	public CompanyResponse createCompany(CompanyRequest request) {
		RecruiterProfile profile = getCurrentRecruiterProfile();
		if (profile.getCompany() != null) {
			throw new DuplicateResourceException("Recruiter profile already has a company");
		}

		Company company = new Company();
		applyRequest(company, request);
		try {
			Company savedCompany = companyRepository.saveAndFlush(company);
			profile.setCompany(savedCompany);
			recruiterProfileRepository.saveAndFlush(profile);
			return toResponse(savedCompany);
		} catch (DataIntegrityViolationException exception) {
			throw new DuplicateResourceException("Recruiter profile already has a company");
		}
	}

	@Transactional(readOnly = true)
	public CompanyResponse getMyCompany() {
		return toResponse(getCompany(getCurrentRecruiterProfile()));
	}

	@Transactional
	public CompanyResponse updateMyCompany(CompanyRequest request) {
		Company company = getCompany(getCurrentRecruiterProfile());
		applyRequest(company, request);
		return toResponse(companyRepository.save(company));
	}

	private RecruiterProfile getCurrentRecruiterProfile() {
		User user = currentUserService.getCurrentUser();
		if (user.getRole() != Role.RECRUITER) {
			throw new UnauthorizedActionException("Only recruiters can manage companies");
		}

		return recruiterProfileRepository.findByUserId(user.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Recruiter profile not found"));
	}

	private Company getCompany(RecruiterProfile profile) {
		if (profile.getCompany() == null) {
			throw new ResourceNotFoundException("Company not found");
		}
		return profile.getCompany();
	}

	private void applyRequest(Company company, CompanyRequest request) {
		company.setName(request.getName().trim());
		company.setDescription(request.getDescription());
		company.setWebsite(request.getWebsite());
		company.setLocation(request.getLocation().trim());
		company.setIndustry(request.getIndustry().trim());
	}

	private CompanyResponse toResponse(Company company) {
		return new CompanyResponse(
				company.getId(), company.getName(), company.getDescription(), company.getWebsite(),
				company.getLocation(), company.getIndustry(), company.getVerified(),
				company.getCreatedAt(), company.getUpdatedAt()
		);
	}
}
