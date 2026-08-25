package com.solvad.backend.problem.event;

import com.solvad.backend.problem.similarity.VectorSimilarityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class ProblemEventListener {

    @Autowired
    private VectorSimilarityService vectorSimilarityService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleProblemCreated(ProblemCreatedEvent event) {
        vectorSimilarityService.updateProblemEmbedding(event.getProblemId());
    }
}