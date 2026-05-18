# Solvad Backend - Coding Standards & Conventions

## ⚠️ CRITICAL RULES

### DATABASE INTEGRITY
**NEVER** delete or remove existing database data:
- ❌ Do NOT drop tables
- ❌ Do NOT delete columns from existing entities
- ❌ Do NOT remove rows from the database
- ❌ Do NOT truncate tables
- ✅ Only ADD new columns (with default values or nullable)
- ✅ Only CREATE new tables
- ✅ Only INSERT new data

### ARCHITECTURE PRESERVATION
**NEVER** restructure existing backend architecture:
- ❌ Do NOT change package structure (com.solvad.backend.*)
- ❌ Do NOT rename existing entities, repositories, services, or controllers
- ❌ Do NOT modify existing database relationships without explicit permission
- ❌ Do NOT change authentication/security configuration
- ✅ Only EXTEND existing functionality
- ✅ Only ADD new endpoints
- ✅ Only CREATE new services/repositories for new features

## Project Structure

```
src/main/java/com/solvad/backend/
├── BackendApplication.java       # Spring Boot entry point
├── config/
│   ├── RestTemplateConfig.java   # REST client config
│   └── SecurityConfig.java       # Security & CORS
├── controller/
│   ├── AuthController.java       # /api/auth/* endpoints
│   └── UserController.java       # /api/users/* endpoints
├── dto/
│   ├── AuthResponse.java         # JWT response
│   ├── LoginRequest.java         # Login payload
│   └── RegisterRequest.java      # Registration payload
├── entity/
│   ├── Role.java                 # Enum: SOLVER, SEEKER, ADMIN
│   ├── User.java                 # @Entity User table
│   └── SolverProfile.java        # @Entity SolverProfile table
├── repository/
│   ├── UserRepository.java       # JPA repository for User
│   └── SolverProfileRepository.java
├── security/
│   ├── JwtAuthenticationFilter.java  # JWT token validation
│   └── JwtService.java              # JWT generation/validation
└── service/
    └── AuthService.java          # Authentication business logic
```

## Authentication Architecture

### JWT Flow
1. User registers/logs in → `AuthController`
2. `AuthService` validates credentials
3. `JwtService` generates JWT token
4. Response includes `token`, `role`, and `user` object
5. Frontend stores token in cookies + localStorage
6. Subsequent requests include `Authorization: Bearer {token}` header
7. `JwtAuthenticationFilter` validates token on each request
8. **NO SESSION STORAGE** - Stateless JWT authentication

### User Roles
```java
public enum Role {
    SOLVER,  // Students
    SEEKER,  // Industry partners
    ADMIN    // Platform administrators
}
```

**Role-based access control:**
- Enforced in `SecurityConfig`
- Frontend routes protected by middleware
- Backend endpoints secured with `@PreAuthorize` annotations

## Database Configuration

### Connection (application.properties)
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/solvad
spring.datasource.username=postgres
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update  # NEVER use 'create' or 'create-drop' in production
```

**CRITICAL:** `ddl-auto=update` only ADDS schema changes, never removes

### Entity Conventions
```java
@Entity
@Table(name = "users")  // Explicit table name
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;  // Use Long for IDs, not Integer
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Enumerated(EnumType.STRING)  // Store as string, not ordinal
    private Role role;
    
    // Always include timestamps
    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

## API Endpoint Patterns

### REST Conventions
- Base path: `/api`
- Authentication: `/api/auth/*`
- Resources: `/api/{resource}/*` (e.g., `/api/users`, `/api/problems`)

### Controller Structure
```java
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")  // Allow frontend CORS
public class AuthController {
    
    @Autowired
    private AuthService authService;
    
    @PostMapping("/register/solver")
    public ResponseEntity<?> registerSolver(@Valid @RequestBody SolverRegisterRequest request) {
        try {
            AuthResponse response = authService.registerSolver(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PostMapping("/register/seeker")
    public ResponseEntity<?> registerSeeker(@Valid @RequestBody SeekerRegisterRequest request) {
        try {
            AuthResponse response = authService.registerSeeker(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
```

**Key Patterns:**
- **Split Registration Endpoints:** Separate endpoints for SOLVER and SEEKER registration
  - `/api/auth/register/solver` - Creates User + SolverProfile
  - `/api/auth/register/seeker` - Creates User + SeekerProfile
- **Type-Safe DTOs:** `SolverRegisterRequest` and `SeekerRegisterRequest` enforce required fields
- **Validation:** `@Valid` annotation triggers Jakarta validation
- **Error Handling:** Try-catch blocks return appropriate HTTP status codes

### Response Format
**Success:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "role": "SOLVER",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "SOLVER",
    "institution": "MIT",
    "degreeProgram": "Computer Science"
  }
}
```

**Error:**
```json
{
  "message": "Invalid credentials",
  "status": 401
}
```

## Naming Conventions

### Java Classes
- **Entities:** `PascalCase` (e.g., `User`, `SolverProfile`, `SeekerProfile`, `Problem`)
- **DTOs:** `PascalCase` + suffix (e.g., `SolverRegisterRequest`, `SeekerRegisterRequest`, `LoginRequest`, `AuthResponse`)
  - **Registration DTOs are role-specific:** Each user role has its own request DTO with required fields
  - `SolverRegisterRequest` - firstName, lastName, institution, degreeProgram
  - `SeekerRegisterRequest` - organizationName, contactPerson
- **Services:** `PascalCase` + `Service` (e.g., `AuthService`, `UserService`)
- **Repositories:** `PascalCase` + `Repository` (e.g., `UserRepository`)
- **Controllers:** `PascalCase` + `Controller` (e.g., `AuthController`)

### Variables & Methods
- **Variables:** `camelCase` (e.g., `firstName`, `authToken`)
- **Methods:** `camelCase` verbs (e.g., `register()`, `findByEmail()`, `validateToken()`)
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `JWT_SECRET`, `TOKEN_EXPIRATION`)

### Database Tables & Columns
- **Tables:** `snake_case` plural (e.g., `users`, `solver_profiles`, `problems`)
- **Columns:** `snake_case` (e.g., `first_name`, `created_at`, `degree_program`)
- **Foreign keys:** `{table}_id` (e.g., `user_id`, `problem_id`)

### API Endpoints
- **Resources:** `kebab-case` or `camelCase` (e.g., `/api/auth/login`, `/api/users/profile`)
- **Path variables:** `{id}` format (e.g., `/api/problems/{id}`)
- **Query params:** `camelCase` (e.g., `?userId=1&status=active`)

## Security Standards

### Password Handling
```java
@Autowired
private PasswordEncoder passwordEncoder;

// ALWAYS hash passwords
String hashedPassword = passwordEncoder.encode(rawPassword);

// NEVER store plain text passwords
// NEVER return passwords in API responses
```

### JWT Configuration
```java
@Value("${jwt.secret}")
private String jwtSecret;  // Store in application.properties, NOT in code

@Value("${jwt.expiration}")
private Long jwtExpiration;  // Token expiration time in milliseconds
```

### CORS Configuration
```java
@Bean
public CorsFilter corsFilter() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(Arrays.asList("http://localhost:3000"));
    config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(Arrays.asList("*"));
    config.setAllowCredentials(true);
    // ...
}
```

## Service Layer Patterns

### Transaction Management
```java
@Service
@Transactional  // Apply to service class or specific methods
public class AuthService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtService jwtService;
    
    public AuthResponse register(RegisterRequest request) {
        // Validation
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        
        // Create user
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setRole(Role.valueOf(request.getRole()));
        
        // Save
        user = userRepository.save(user);
        
        // Generate token
        String token = jwtService.generateToken(user);
        
        // Return response
        return new AuthResponse(token, user.getRole().toString(), user);
    }
}
```

## Repository Patterns

### JPA Query Methods
```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // Spring Data JPA auto-generates queries from method names
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRole(Role role);
    List<User> findByInstitution(String institution);
    
    // Custom queries with @Query
    @Query("SELECT u FROM User u WHERE u.role = :role AND u.createdAt > :date")
    List<User> findRecentUsersByRole(@Param("role") Role role, @Param("date") LocalDateTime date);
}
```

## Error Handling

### Exception Handling
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(RuntimeException ex) {
        ErrorResponse error = new ErrorResponse(ex.getMessage(), HttpStatus.BAD_REQUEST.value());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
    
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorizedException(UnauthorizedException ex) {
        ErrorResponse error = new ErrorResponse(ex.getMessage(), HttpStatus.UNAUTHORIZED.value());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }
}
```

## Testing Standards

### Unit Tests
- Place in `src/test/java` mirroring package structure
- Use JUnit 5 and Mockito
- Test services independently of controllers
- Mock repositories and external dependencies

### Integration Tests
- Use `@SpringBootTest`
- Test full request/response flow
- Use in-memory H2 database for tests
- Clean database state between tests

## Dependency Management (pom.xml)

### Core Dependencies
```xml
<!-- Spring Boot Starter Web -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>

<!-- Spring Boot Starter Security -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<!-- Spring Boot Starter Data JPA -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>

<!-- PostgreSQL Driver -->
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
</dependency>

<!-- JWT -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.11.5</version>
</dependency>
```

## Migration Checklist

### Adding New Features
- [ ] Create new entities if needed (DO NOT modify existing)
- [ ] Create DTOs for request/response
- [ ] Create repository interface
- [ ] Implement service layer
- [ ] Create controller endpoints
- [ ] Add validation
- [ ] Handle errors appropriately
- [ ] Update CORS configuration if needed
- [ ] Test with frontend integration

### Database Changes
- [ ] Only ADD columns (make nullable or provide defaults)
- [ ] Only CREATE new tables
- [ ] DO NOT remove existing columns
- [ ] DO NOT rename existing tables
- [ ] Verify `ddl-auto=update` setting
- [ ] Test migrations on development database first

## DO NOT

❌ Delete database tables or columns
❌ Remove existing entity fields
❌ Change package structure
❌ Modify security configuration without understanding implications
❌ Store passwords in plain text
❌ Return sensitive data in API responses
❌ Use `ddl-auto=create` or `create-drop` (destroys data)
❌ Hardcode secrets in source code
❌ Ignore CORS configuration
❌ Skip validation on user inputs

## ALWAYS DO

✅ Preserve existing database schema (only add, never remove)
✅ Maintain current package structure
✅ Hash passwords with BCrypt
✅ Validate all user inputs
✅ Use DTOs for API requests/responses
✅ Add proper error handling
✅ Configure CORS for frontend communication
✅ Use transactions for multi-step operations
✅ Test endpoints with Postman or similar tools
✅ Document new API endpoints
✅ Follow existing naming conventions
✅ Keep authentication system intact
✅ Store secrets in `application.properties`
✅ Use `@Transactional` for database operations
✅ Return appropriate HTTP status codes