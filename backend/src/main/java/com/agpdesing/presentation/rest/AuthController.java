package com.agpdesing.presentation.rest;

import com.agpdesing.application.port.out.TokenProvider;
import com.agpdesing.application.usecase.auth.AuthenticateAdminUseCase;
import com.agpdesing.presentation.ratelimit.ClientIpResolver;
import com.agpdesing.presentation.ratelimit.LoginRateLimiter;
import com.agpdesing.presentation.dto.request.LoginRequest;
import com.agpdesing.presentation.mapper.AuthDtoMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticateAdminUseCase authenticate;
    private final LoginRateLimiter rateLimiter;
    private final ClientIpResolver clientIp;
    private final AuthDtoMapper mapper;

    public AuthController(AuthenticateAdminUseCase authenticate, LoginRateLimiter rateLimiter,
                          ClientIpResolver clientIp, AuthDtoMapper mapper) {
        this.authenticate = authenticate;
        this.rateLimiter = rateLimiter;
        this.clientIp = clientIp;
        this.mapper = mapper;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest body, HttpServletRequest request) {
        if (!rateLimiter.tryConsume(clientIp.resolve(request))) {
            ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.TOO_MANY_REQUESTS,
                    "Demasiados intentos. Espera un minuto.");
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(pd);
        }
        TokenProvider.IssuedToken token = authenticate.execute(body.username(), body.password());
        return ResponseEntity.ok(mapper.toResponse(token, body.username()));
    }
}
