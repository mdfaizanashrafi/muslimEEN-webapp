# MuslimEEN Authentication Flow

> Sequence diagrams showing login, registration, and authenticated request flows.

## Login Flow

```mermaid
sequenceDiagram
    autonumber
    actor U as 👤 User
    participant F as ⚛️ Frontend<br/>(Next.js)
    participant API as 🚀 API Gateway<br/>(Express)
    participant AuthC as 🎮 Auth Controller
    participant AuthS as 🔧 Auth Service
    participant JWT as 🔑 JWT Service
    participant PS as 🔒 Password Service
    participant UR as 👤 User Repository
    participant DB as 🐘 PostgreSQL
    participant Logger as 📊 Logger

    U->>F: Enter email & password
    F->>F: Validate form inputs
    F->>API: POST /api/auth/login<br/>{email, password}
    
    API->>API: Apply rate limiting<br/>(authLimiter: 5 req/min)
    API->>API: Validate request body<br/>(Joi schema)
    
    API->>AuthC: login(req, res)
    AuthC->>AuthS: login({email, password})
    
    AuthS->>UR: findByEmail(email)
    UR->>DB: SELECT * FROM users<br/>WHERE email = $1
    DB-->>UR: User record (with password_hash)
    UR-->>AuthS: User object
    
    alt User not found
        AuthS-->>AuthC: throw AuthError<br/>INVALID_CREDENTIALS
        AuthC-->>API: 401 Unauthorized
        API-->>F: {success: false, error: {...}}
        F-->>U: Display error message
    else User found
        AuthS->>PS: verifyPassword(password, hash)
        PS->>PS: bcrypt.compare()
        PS-->>AuthS: isValid: boolean
        
        alt Invalid password
            AuthS-->>AuthC: throw AuthError<br/>INVALID_CREDENTIALS
            AuthC-->>API: 401 Unauthorized
            API-->>F: {success: false, error: {...}}
            F-->>U: Display error message
        else Valid password
            AuthS->>AuthS: Check user.isActive
            
            alt Account disabled
                AuthS-->>AuthC: throw AuthError<br/>ACCOUNT_DISABLED
                AuthC-->>API: 403 Forbidden
                API-->>F: {success: false, error: {...}}
                F-->>U: Display error message
            else Account active
                AuthS->>UR: updateLastLogin(user.id)
                UR->>DB: UPDATE users SET last_login = NOW()
                
                AuthS->>JWT: generateToken(payload)
                JWT->>JWT: Sign with JWT_SECRET<br/>Expiry: 24h
                JWT-->>AuthS: token: string
                
                AuthS->>AuthS: generateCsrfToken()
                AuthS->>AuthS: Remove password_hash from user
                
                AuthS-->>AuthC: {user, token, csrfToken}
                AuthC->>Logger: info("User logged in", {...})
                AuthC-->>API: {success: true, token, csrfToken, user}
                
                API-->>F: HTTP 200 + JSON response
                F->>F: Store token in memory/localStorage
                F->>F: Store csrfToken
                F->>F: Update auth context
                F-->>U: Redirect to dashboard
            end
        end
    end
```

## Registration Flow (Invitation-Based)

```mermaid
sequenceDiagram
    autonumber
    actor U as 👤 New User
    participant F as ⚛️ Frontend<br/>(Next.js)
    participant API as 🚀 API Gateway
    participant AuthC as 🎮 Auth Controller
    participant AuthS as 🔧 Auth Service
    participant IS as 📨 Invitation Service
    participant IR as 📨 Invitation Repository
    participant PS as 🔒 Password Service
    participant UR as 👤 User Repository
    participant DB as 🐘 PostgreSQL
    participant TS as 🛡️ Trust Score Service
    participant Logger as 📊 Logger

    U->>F: Click invitation link<br/>(/register?code=XYZ)
    F->>API: POST /api/auth/validate-invitation<br/>{invitationCode}
    API->>AuthC: validateInvitation
    AuthC->>AuthS: validateInvitation(code)
    AuthS->>IS: validateInvitationExternal(code)
    IS->>IR: findByCode(code)
    IR->>DB: SELECT * FROM invitations<br/>WHERE code = $1
    DB-->>IR: Invitation record
    IR-->>IS: Invitation
    IS->>IS: Check status & expiry
    IS-->>AuthS: {valid: true, invitation}
    AuthS-->>AuthC: Validation result
    AuthC-->>API: {success: true, data: {invitation}}
    API-->>F: Invitation details
    F-->>U: Show registration form<br/>(pre-filled email)

    U->>F: Submit registration form<br/>{email, password, firstName, lastName, invitationCode}
    F->>API: POST /api/auth/register
    API->>API: Rate limiting + validation
    API->>AuthC: register(req, res)
    AuthC->>AuthS: register(data)
    
    AuthS->>IS: validateInvitationExternal(code)
    IS->>IR: findByCode(code)
    IR-->>IS: Invitation
    IS->>IS: Validate status
    IS-->>AuthS: {valid, invitation}
    
    AuthS->>AuthS: Check email matches invitation
    
    alt Email mismatch
        AuthS-->>AuthC: throw AuthError<br/>EMAIL_MISMATCH
        AuthC-->>API: 400 Bad Request
        API-->>F: Error response
        F-->>U: Show error
    else Email matches
        AuthS->>UR: findByEmail(email)
        UR->>DB: SELECT * FROM users<br/>WHERE email = $1
        DB-->>UR: Existing user?
        UR-->>AuthS: User or null
        
        alt User exists
            AuthS-->>AuthC: throw AuthError<br/>USER_EXISTS
            AuthC-->>API: 400 Bad Request
            API-->>F: Error response
            F-->>U: Show error
        else New user
            AuthS->>PS: hashPassword(password)
            PS->>PS: bcrypt.hash(12 rounds)
            PS-->>AuthS: passwordHash
            
            AuthS->>UR: create({email, passwordHash, ...})
            UR->>DB: INSERT INTO users ...
            DB-->>UR: New user record
            UR-->>AuthS: User object
            
            AuthS->>IS: acceptInvitationExternal(code, userId)
            IS->>IR: accept(code, userId)
            IR->>DB: UPDATE invitations<br/>SET status = 'accepted'
            IR-->>IS: Success
            IS->>TS: recalculate(inviterId)
            TS->>DB: Update trust scores
            IS-->>AuthS: Success
            
            AuthS->>JWT: generateToken(payload)
            JWT-->>AuthS: token
            AuthS->>AuthS: generateCsrfToken()
            
            AuthS-->>AuthC: {user, token, csrfToken}
            AuthC->>Logger: info("User registered", {...})
            AuthC-->>API: 201 Created + response
            API-->>F: Success response
            F->>F: Store tokens, update context
            F-->>U: Redirect to onboarding
        end
    end
```

## Authenticated Request Flow

```mermaid
sequenceDiagram
    autonumber
    actor U as 👤 User
    participant F as ⚛️ Frontend<br/>(Next.js)
    participant API as 🛡️ API Gateway
    participant AuthM as 🔐 Auth Middleware
    participant JWT as 🔑 JWT Service
    participant Ctrl as 🎮 Controller
    participant Service as 🔧 Service
    participant DB as 🐘 PostgreSQL

    U->>F: Navigate to protected page
    F->>F: Check auth context
    
    alt No token stored
        F-->>U: Redirect to login
    else Token exists
        F->>API: GET /api/user/profile<br/>Headers:<br/>Authorization: Bearer {token}<br/>X-CSRF-Token: {csrf}
        
        API->>AuthM: authenticate(req, res, next)
        AuthM->>AuthM: Extract token from header
        
        alt No token provided
            AuthM-->>API: 401 Unauthorized
            API-->>F: Error response
            F->>F: Clear auth state
            F-->>U: Redirect to login
        else Token provided
            AuthM->>JWT: verifyToken(token)
            JWT->>JWT: jwt.verify()<br/>Check signature & expiry
            
            alt Invalid/expired token
                JWT-->>AuthM: Verification failed
                AuthM-->>API: 401 Unauthorized
                API-->>F: Error response
                F->>F: Clear auth state
                F-->>U: Redirect to login
            else Valid token
                JWT-->>AuthM: Decoded payload<br/>{id, email, role}
                AuthM->>AuthM: Attach user to req
                AuthM->>API: next()
                
                API->>Ctrl: getProfile(req, res)
                Ctrl->>Service: getCurrentUser(userId)
                Service->>DB: SELECT * FROM users<br/>WHERE id = $1
                DB-->>Service: User data
                Service-->>Ctrl: User profile
                Ctrl-->>API: {success: true, user}
                API-->>F: 200 OK + user data
                F->>F: Render profile page
                F-->>U: Display profile
            end
        end
    end
```

## Token Refresh Flow (Future Implementation)

```mermaid
sequenceDiagram
    autonumber
    actor U as 👤 User
    participant F as ⚛️ Frontend
    participant API as 🚀 API Gateway
    participant AuthC as 🎮 Auth Controller
    participant AuthS as 🔧 Auth Service
    participant JWT as 🔑 JWT Service
    participant RT as 🔄 Refresh Token Repository
    participant DB as 🐘 PostgreSQL

    U->>F: Session active (token expires soon)
    F->>API: POST /api/auth/refresh<br/>{refreshToken}
    
    API->>AuthC: refreshToken(req, res)
    AuthC->>AuthS: refreshAccessToken(refreshToken)
    
    AuthS->>RT: findByToken(refreshToken)
    RT->>DB: SELECT * FROM refresh_tokens<br/>WHERE token = $1
    DB-->>RT: Token record
    RT-->>AuthS: RefreshToken or null
    
    alt Token not found
        AuthS-->>AuthC: throw AuthError<br/>INVALID_REFRESH_TOKEN
        AuthC-->>API: 401 Unauthorized
        API-->>F: Error response
        F->>F: Clear auth state
        F-->>U: Redirect to login
    else Token found
        AuthS->>AuthS: Check if revoked
        AuthS->>AuthS: Check expiry
        
        alt Token revoked or expired
            AuthS-->>AuthC: throw AuthError<br/>TOKEN_EXPIRED
            AuthC-->>API: 401 Unauthorized
            API-->>F: Error response
            F->>F: Clear auth state
            F-->>U: Redirect to login
        else Token valid
            AuthS->>AuthS: Revoke old token
            AuthS->>RT: revoke(oldTokenId)
            RT->>DB: UPDATE refresh_tokens<br/>SET revoked_at = NOW()
            
            AuthS->>JWT: generateToken(payload)
            JWT-->>AuthS: newAccessToken
            AuthS->>AuthS: generateCsrfToken()
            AuthS->>RT: create({userId, token, expiresAt})
            RT->>DB: INSERT INTO refresh_tokens
            
            AuthS-->>AuthC: {token, csrfToken, refreshToken}
            AuthC-->>API: 200 OK + tokens
            API-->>F: New tokens
            F->>F: Update stored tokens
            F-->>U: Continue session seamlessly
        end
    end
```

## Security Features

| Feature | Implementation | Purpose |
|---------|----------------|---------|
| **JWT Tokens** | HS256 algorithm, 24h expiry | Stateless authentication |
| **CSRF Protection** | Double-submit cookie pattern | Prevent cross-site request forgery |
| **Rate Limiting** | 5 req/min for auth endpoints | Prevent brute force attacks |
| **Password Hashing** | bcrypt with 12 rounds | Secure password storage |
| **HTTPS Only** | All endpoints | Transport layer security |
| **Secure Headers** | Helmet.js | XSS, clickjacking protection |

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_CREDENTIALS` | 401 | Email or password incorrect |
| `ACCOUNT_DISABLED` | 403 | User account deactivated |
| `INVALID_INVITATION` | 400 | Invitation code invalid/expired |
| `EMAIL_MISMATCH` | 400 | Email doesn't match invitation |
| `USER_EXISTS` | 400 | Account already exists |
| `TOKEN_EXPIRED` | 401 | JWT token has expired |
| `INVALID_TOKEN` | 401 | JWT token malformed |
| `CSRF_TOKEN_MISSING` | 403 | CSRF token not provided |
| `CSRF_TOKEN_INVALID` | 403 | CSRF token mismatch |
