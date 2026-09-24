package com.carsleaderboard.vote;

import com.carsleaderboard.leaderboard.LeaderboardService;
import com.carsleaderboard.user.CurrentUserResolver;
import com.carsleaderboard.user.User;
import com.carsleaderboard.vote.dto.VoteResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = VoteController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class VoteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private VoteService voteService;
    @MockitoBean
    private LeaderboardService leaderboardService;
    @MockitoBean
    private CurrentUserResolver currentUserResolver;

    private User user() {
        User user = new User();
        user.setId("user1");
        user.setName("Chetan");
        return user;
    }

    @Test
    void voteReturns401WhenNotAuthenticated() throws Exception {
        when(currentUserResolver.resolve(null)).thenReturn(null);

        mockMvc.perform(post("/api/cars/car1/vote"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void voteReturnsUpdatedCountAndRankOnSuccess() throws Exception {
        when(currentUserResolver.resolve(null)).thenReturn(user());
        when(voteService.vote("user1", "car1")).thenReturn(new VoteResponse(true, "car1", 42, 3));

        mockMvc.perform(post("/api/cars/car1/vote"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.voteCount").value(42))
                .andExpect(jsonPath("$.rank").value(3));
    }

    @Test
    void voteReturns409WhenAlreadyVoted() throws Exception {
        when(currentUserResolver.resolve(null)).thenReturn(user());
        when(voteService.vote("user1", "car1"))
                .thenThrow(new ResponseStatusException(HttpStatus.CONFLICT, "You have already voted for this car."));

        mockMvc.perform(post("/api/cars/car1/vote"))
                .andExpect(status().isConflict());
    }

    @Test
    void voteReturns404WhenCarMissing() throws Exception {
        when(currentUserResolver.resolve(null)).thenReturn(user());
        when(voteService.vote("user1", "missing"))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Car not found: missing"));

        mockMvc.perform(post("/api/cars/missing/vote"))
                .andExpect(status().isNotFound());
    }

    @Test
    void voteStatusIsFalseWhenLoggedOut() throws Exception {
        when(currentUserResolver.resolve(null)).thenReturn(null);
        when(voteService.hasVoted(null, "car1")).thenReturn(false);

        mockMvc.perform(get("/api/cars/car1/vote-status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasVoted").value(false));
    }

    @Test
    void rankingReflectsLeaderboardState() throws Exception {
        when(leaderboardService.getRank("car1")).thenReturn(1L); // 0-based
        when(leaderboardService.getScore("car1")).thenReturn(176821.0);

        mockMvc.perform(get("/api/cars/car1/ranking"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rank").value(2))
                .andExpect(jsonPath("$.votes").value(176821));
    }

    @Test
    void rankingIsNullForAnUnrankedCar() throws Exception {
        when(leaderboardService.getRank("car1")).thenReturn(null);
        when(leaderboardService.getScore("car1")).thenReturn(null);

        mockMvc.perform(get("/api/cars/car1/ranking"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rank").doesNotExist())
                .andExpect(jsonPath("$.votes").value(0));
    }
}
