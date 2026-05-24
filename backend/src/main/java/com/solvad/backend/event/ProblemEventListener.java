package com.solvad.backend.event;

import com.solvad.backend.event.ProblemCreatedEvent;
import com.solvad.backend.service.VectorSimilarityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
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