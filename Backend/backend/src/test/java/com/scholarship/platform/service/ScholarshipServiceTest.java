package com.scholarship.platform.service;

import com.scholarship.platform.dto.request.ScholarshipRequest;
import com.scholarship.platform.dto.response.ScholarshipResponse;
import com.scholarship.platform.exception.ResourceNotFoundException;
import com.scholarship.platform.exception.UnauthorizedException;
import com.scholarship.platform.model.Scholarship;
import com.scholarship.platform.model.User;
import com.scholarship.platform.model.enums.DegreeLevel;
import com.scholarship.platform.model.enums.FundingType;
import com.scholarship.platform.model.enums.UserRole;
import com.scholarship.platform.repository.ScholarshipRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ScholarshipService Unit Tests")
class ScholarshipServiceTest {

    @Mock  ScholarshipRepository scholarshipRepository;
    @Spy   ModelMapper modelMapper = createModelMapper();

    @InjectMocks ScholarshipService scholarshipService;

    private User adminUser;
    private User studentUser;
    private Scholarship sampleScholarship;

    @BeforeEach
    void setUp() {
        adminUser = User.builder().id("admin-1").role(UserRole.ADMIN).email("admin@test.com").build();
        studentUser = User.builder().id("student-1").role(UserRole.STUDENT).email("student@test.com").build();

        sampleScholarship = Scholarship.builder()
                .id("sch-1")
                .name("Test Scholarship")
                .provider("Test University")
                .country("US")
                .degreeLevel(DegreeLevel.UNDERGRADUATE)
                .fundingType(FundingType.FULL_FUNDING)
                .deadline(LocalDateTime.now().plusMonths(3))
                .createdBy("admin-1")
                .active(true)
                .deleted(false)
                .viewCount(0)
                .build();
    }

    @Test
    @DisplayName("getById – increments view count and returns response")
    void getById_shouldIncrementViewCount() {
        when(scholarshipRepository.findByIdAndDeletedFalse("sch-1"))
                .thenReturn(Optional.of(sampleScholarship));
        when(scholarshipRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ScholarshipResponse response = scholarshipService.getById("sch-1");

        assertThat(response.getId()).isEqualTo("sch-1");
        assertThat(response.getName()).isEqualTo("Test Scholarship");
        verify(scholarshipRepository).save(argThat(s -> s.getViewCount() == 1));
    }

    @Test
    @DisplayName("getById – throws ResourceNotFoundException for unknown ID")
    void getById_notFound() {
        when(scholarshipRepository.findByIdAndDeletedFalse("bad-id"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> scholarshipService.getById("bad-id"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("create – saves and returns the scholarship")
    void create_shouldSaveScholarship() {
        ScholarshipRequest request = new ScholarshipRequest();
        request.setName("New Scholarship");
        request.setProvider("Provider");
        request.setDescription("Desc");
        request.setCountry("UK");
        request.setDegreeLevel(DegreeLevel.POSTGRADUATE);
        request.setFieldOfStudy("Computer Science");
        request.setFundingType(FundingType.PARTIAL_FUNDING);
        request.setDeadline(LocalDateTime.now().plusMonths(6));

        when(scholarshipRepository.save(any())).thenAnswer(inv -> {
            Scholarship s = inv.getArgument(0);
            s.setId("new-sch");
            return s;
        });

        ScholarshipResponse response = scholarshipService.create(request, adminUser);

        assertThat(response.getName()).isEqualTo("New Scholarship");
        verify(scholarshipRepository).save(any(Scholarship.class));
    }

    @Test
    @DisplayName("delete – admin can delete any scholarship")
    void delete_adminCanDelete() {
        when(scholarshipRepository.findByIdAndDeletedFalse("sch-1"))
                .thenReturn(Optional.of(sampleScholarship));
        when(scholarshipRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        scholarshipService.delete("sch-1", adminUser);

        verify(scholarshipRepository).save(argThat(Scholarship::isDeleted));
    }

    @Test
    @DisplayName("delete – student cannot delete a scholarship")
    void delete_studentCannotDelete() {
        when(scholarshipRepository.findByIdAndDeletedFalse("sch-1"))
                .thenReturn(Optional.of(sampleScholarship));

        assertThatThrownBy(() -> scholarshipService.delete("sch-1", studentUser))
                .isInstanceOf(UnauthorizedException.class);
    }

    private static ModelMapper createModelMapper() {
        ModelMapper mm = new ModelMapper();
        mm.getConfiguration().setMatchingStrategy(MatchingStrategies.STRICT).setSkipNullEnabled(true);
        return mm;
    }
}
