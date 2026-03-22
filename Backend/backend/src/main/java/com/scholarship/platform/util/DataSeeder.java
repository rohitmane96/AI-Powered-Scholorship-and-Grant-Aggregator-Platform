package com.scholarship.platform.util;

import com.scholarship.platform.model.Scholarship;
import com.scholarship.platform.model.User;
import com.scholarship.platform.model.enums.*;
import com.scholarship.platform.repository.ScholarshipRepository;
import com.scholarship.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Seeds sample data into MongoDB when the application starts in the "dev" profile.
 * Run with: --spring.profiles.active=dev
 *
 * <p>Creates:
 * <ul>
 *   <li>3 users – admin, student, institution</li>
 *   <li>10 sample scholarships</li>
 * </ul>
 */
@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository        userRepository;
    private final ScholarshipRepository scholarshipRepository;
    private final PasswordEncoder       passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already seeded – skipping");
            return;
        }
        seedUsers();
        seedScholarships();
        log.info("Sample data seeded successfully");
    }

    private void seedUsers() {
        User admin = User.builder()
                .fullName("Admin User")
                .email("admin@scholarmatch.ai")
                .password(passwordEncoder.encode("Admin@1234"))
                .role(UserRole.ADMIN)
                .verified(true)
                .profileCompletion(100)
                .build();

        User student = User.builder()
                .fullName("Alice Johnson")
                .email("alice@student.com")
                .password(passwordEncoder.encode("Student@1234"))
                .role(UserRole.STUDENT)
                .verified(true)
                .education(User.Education.builder()
                        .level(DegreeLevel.UNDERGRADUATE)
                        .fieldOfStudy("Computer Science")
                        .currentGPA(3.8)
                        .graduationYear(2025)
                        .build())
                .preferences(User.Preferences.builder()
                        .targetCountries(List.of("US", "UK", "Germany"))
                        .degreeLevel(DegreeLevel.POSTGRADUATE)
                        .fundingTypes(List.of(FundingType.FULL_FUNDING))
                        .build())
                .profileCompletion(80)
                .build();

        User institution = User.builder()
                .fullName("MIT Admissions")
                .email("admissions@mit.edu")
                .password(passwordEncoder.encode("Inst@1234"))
                .role(UserRole.INSTITUTION)
                .verified(true)
                .institutionName("Massachusetts Institute of Technology")
                .institutionType("University")
                .country("US")
                .website("https://web.mit.edu")
                .profileCompletion(90)
                .build();

        List<User> saved = userRepository.saveAll(List.of(admin, student, institution));
        log.info("Seeded {} users", saved.size());
    }

    private void seedScholarships() {
        String institutionId = userRepository
                .findByEmailAndDeletedFalse("admissions@mit.edu")
                .map(User::getId)
                .orElse("system");

        List<Scholarship> scholarships = List.of(
            buildScholarship("Fulbright Scholarship", "US Department of State",
                "Full funding for international students to study in the US.",
                "US", DegreeLevel.POSTGRADUATE, "Any", FundingType.FULL_FUNDING,
                5000.0, 50000.0, true, institutionId),

            buildScholarship("Rhodes Scholarship", "Rhodes Trust",
                "Prestigious scholarship for outstanding students to study at Oxford.",
                "UK", DegreeLevel.POSTGRADUATE, "Any", FundingType.FULL_FUNDING,
                20000.0, 60000.0, true, institutionId),

            buildScholarship("DAAD Scholarship", "German Academic Exchange Service",
                "Scholarship for international students to study in Germany.",
                "Germany", DegreeLevel.POSTGRADUATE, "Engineering", FundingType.FULL_FUNDING,
                8000.0, 12000.0, false, institutionId),

            buildScholarship("Commonwealth Scholarship", "Commonwealth Scholarship Commission",
                "For students from Commonwealth countries to study in the UK.",
                "UK", DegreeLevel.POSTGRADUATE, "Any", FundingType.FULL_FUNDING,
                15000.0, 40000.0, true, institutionId),

            buildScholarship("Chevening Scholarship", "UK Government",
                "Fully funded masters scholarships for future global leaders.",
                "UK", DegreeLevel.POSTGRADUATE, "Any", FundingType.FULL_FUNDING,
                25000.0, 45000.0, true, institutionId),

            buildScholarship("Erasmus+ Scholarship", "European Commission",
                "European exchange program with funding for study and internships.",
                "Germany", DegreeLevel.UNDERGRADUATE, "Any", FundingType.PARTIAL_FUNDING,
                500.0, 1000.0, false, institutionId),

            buildScholarship("MIT Merit Scholarship", "Massachusetts Institute of Technology",
                "Merit-based scholarship for outstanding CS and Engineering students.",
                "US", DegreeLevel.UNDERGRADUATE, "Computer Science", FundingType.PARTIAL_FUNDING,
                10000.0, 30000.0, false, institutionId),

            buildScholarship("Gates Cambridge Scholarship", "Bill & Melinda Gates Foundation",
                "Full cost scholarship to pursue postgraduate study at Cambridge.",
                "UK", DegreeLevel.PHD, "Any", FundingType.FULL_FUNDING,
                30000.0, 70000.0, true, institutionId),

            buildScholarship("Australian Awards Scholarship", "Australian Government",
                "Scholarship for students from developing countries to study in Australia.",
                "Australia", DegreeLevel.POSTGRADUATE, "Any", FundingType.FULL_FUNDING,
                20000.0, 45000.0, false, institutionId),

            buildScholarship("Japan MEXT Scholarship", "Japanese Government",
                "Full scholarship for international students to study in Japan.",
                "Japan", DegreeLevel.POSTGRADUATE, "Any", FundingType.FULL_FUNDING,
                800.0, 1200.0, false, institutionId)
        );

        List<Scholarship> saved = scholarshipRepository.saveAll(scholarships);
        log.info("Seeded {} scholarships", saved.size());
    }

    private Scholarship buildScholarship(String name, String provider, String description,
                                          String country, DegreeLevel degreeLevel,
                                          String fieldOfStudy, FundingType fundingType,
                                          double minAmount, double maxAmount,
                                          boolean featured, String createdBy) {
        return Scholarship.builder()
                .name(name)
                .provider(provider)
                .description(description)
                .country(country)
                .degreeLevel(degreeLevel)
                .fieldOfStudy(fieldOfStudy)
                .fundingType(fundingType)
                .fundingAmount(Scholarship.FundingAmount.builder()
                        .min(minAmount).max(maxAmount).currency("USD").build())
                .deadline(LocalDateTime.now().plusMonths(6))
                .featured(featured)
                .active(true)
                .createdBy(createdBy)
                .eligibility(List.of("Academic excellence", "English proficiency"))
                .requirements(List.of("Transcript", "CV", "Statement of Purpose"))
                .tags(List.of("fully-funded", "international"))
                .build();
    }
}
