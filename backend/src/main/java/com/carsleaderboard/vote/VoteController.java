package com.carsleaderboard.vote;

import com.carsleaderboard.leaderboard.LeaderboardService;
import com.carsleaderboard.leaderboard.dto.RankingResponse;
import com.carsleaderboard.user.CurrentUserResolver;
import com.carsleaderboard.user.User;
import com.carsleaderboard.vote.dto.VoteResponse;
import com.carsleaderboard.vote.dto.VoteStatusResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/cars/{carId}")
public class VoteController {

    private final VoteService voteService;
    private final LeaderboardService leaderboardService;
    private final CurrentUserResolver currentUserResolver;

    public VoteController(VoteService voteService, LeaderboardService leaderboardService,
                           CurrentUserResolver currentUserResolver) {
        this.voteService = voteService;
        this.leaderboardService = leaderboardService;
        this.currentUserResolver = currentUserResolver;
    }

    @PostMapping("/vote")
    public VoteResponse vote(@PathVariable String carId, @AuthenticationPrincipal OAuth2User principal) {
        User user = currentUserResolver.resolve(principal);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in with Google to vote.");
        }
        return voteService.vote(user.getId(), carId);
    }

    @GetMapping("/vote-status")
    public VoteStatusResponse voteStatus(@PathVariable String carId, @AuthenticationPrincipal OAuth2User principal) {
        User user = currentUserResolver.resolve(principal);
        return new VoteStatusResponse(voteService.hasVoted(user != null ? user.getId() : null, carId));
    }

    @GetMapping("/ranking")
    public RankingResponse ranking(@PathVariable String carId) {
        Long rank = leaderboardService.getRank(carId);
        Double score = leaderboardService.getScore(carId);
        long votes = score != null ? score.longValue() : 0;
        Long oneBasedRank = rank != null ? rank + 1 : null;
        return new RankingResponse(carId, oneBasedRank, votes);
    }
}
