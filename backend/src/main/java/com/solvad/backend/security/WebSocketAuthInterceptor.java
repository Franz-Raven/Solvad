package com.solvad.backend.security;

import com.solvad.backend.user.User;
import com.solvad.backend.user.UserRepository;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public WebSocketAuthInterceptor(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String header = accessor.getFirstNativeHeader("Authorization");
            if (header == null || !header.startsWith("Bearer ")) {
                throw new MessageDeliveryException("Missing or malformed Authorization header");
            }
            String token = header.substring(7);
            UUID userId;
            String role;
            try {
                userId = jwtService.extractUserId(token);
                role = jwtService.extractRole(token);
            } catch (Exception e) {
                throw new MessageDeliveryException("Invalid or expired token.");
            }

            userRepository.findById(userId)
                    .orElseThrow(() -> new MessageDeliveryException("User not found."));

            var authorities = role == null
                    ? List.<SimpleGrantedAuthority>of() //if a token somehow has no role claim
                    : List.of(new SimpleGrantedAuthority("ROLE_" + role));

            accessor.setUser(new UsernamePasswordAuthenticationToken(userId.toString(), null, authorities));
        }
        return message;
    }
}