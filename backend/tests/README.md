# MuslimEEN Backend Tests

## Test Structure

```
tests/
├── setup.ts                    # Test initialization
├── mocks/
│   └── models.ts              # Mock models and data
├── unit/
│   ├── utils/
│   │   ├── security.test.ts   # Security utility tests
│   │   └── formatters.test.ts # Formatter utility tests
│   └── services/
│       ├── JwtService.test.ts
│       ├── PasswordService.test.ts
│       ├── AuthService.test.ts
│       ├── UserService.test.ts
│       ├── TrustScoreService.test.ts
│       ├── ConnectionService.test.ts
│       ├── NotificationService.test.ts
│       ├── VerificationService.test.ts
│       ├── IslamicFinanceService.test.ts
│       └── InvitationService.test.ts
└── README.md                  # This file
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Unit Tests Only
```bash
npm run test:unit
```

### Run Specific Test File
```bash
npx jest tests/unit/services/AuthService.test.ts
```

### Run Tests with Coverage
```bash
npx jest --coverage
```

### Run Tests in Watch Mode
```bash
npx jest --watch
```

## Test Categories

### 1. Utility Tests
Pure function tests with no dependencies.

- **security.test.ts**: Token generation, hashing, secure compare
- **formatters.test.ts**: Data formatting, sanitization, type conversion

### 2. Service Tests
Business logic tests with mocked dependencies.

| Service | Tests Cover |
|---------|-------------|
| JwtService | Token generation, verification, decoding |
| PasswordService | Hashing, verification, strength validation |
| AuthService | Login, register, logout, validation |
| UserService | Profile CRUD, status management |
| TrustScoreService | Calculation, history, eligibility |
| ConnectionService | Requests, acceptance, management |
| NotificationService | Creation, retrieval, marking read |
| VerificationService | Biometric, witness, business verification |
| IslamicFinanceService | Sadaqah, Qard Hasan, Zakat calculations |
| InvitationService | Creation, validation, acceptance |

## Mocking Strategy

### Models are Mocked
All database models are mocked in `tests/mocks/models.ts`:

```typescript
// Example: Mocking User model
jest.mock('../../../src/models/User', () => mockUserModel);
```

### Services are Mocked when Testing Other Services
When testing a service that depends on other services, those dependencies are mocked:

```typescript
// Example: VerificationService depends on TrustScoreService
jest.mock('../../../src/services/TrustScoreService');
```

## Writing New Tests

### Test Template

```typescript
import { ServiceName } from '../../../src/services/ServiceName';
import { mockModel } from '../../mocks/models';

// Mock dependencies
jest.mock('../../../src/models/ModelName', () => mockModel);

describe('ServiceName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should do something', async () => {
      // Arrange
      mockModel.method.mockResolvedValue(mockData);

      // Act
      const result = await ServiceName.methodName(input);

      // Assert
      expect(result).toEqual(expected);
    });

    it('should throw error for invalid input', async () => {
      await expect(ServiceName.methodName(invalidInput)).rejects.toThrow(
        new ServiceName.ServiceError('CODE', 'Message', 400)
      );
    });
  });
});
```

## Test Coverage Goals

| Module | Target Coverage |
|--------|-----------------|
| Services | 90%+ |
| Utils | 95%+ |
| Controllers | 80%+ (integration tests) |
| Models | 70%+ (mostly integration) |

## Current Test Statistics

| Service | Test Cases | Status |
|---------|-----------|--------|
| Security Utils | 12 | ✅ Complete |
| Formatter Utils | 14 | ✅ Complete |
| JwtService | 10 | ✅ Complete |
| PasswordService | 9 | ✅ Complete |
| AuthService | 18 | ✅ Complete |
| UserService | 15 | ✅ Complete |
| TrustScoreService | 14 | ✅ Complete |
| ConnectionService | 13 | ✅ Complete |
| NotificationService | 16 | ✅ Complete |
| VerificationService | 17 | ✅ Complete |
| IslamicFinanceService | 20 | ✅ Complete |
| InvitationService | 15 | ✅ Complete |

**Total: 173 test cases**

## Best Practices

1. **Isolate Tests**: Each test should be independent
2. **Clear Mocks**: Use `beforeEach` to clear mocks
3. **Test Error Cases**: Always test error scenarios
4. **Use Descriptive Names**: Test names should explain what is being tested
5. **Arrange-Act-Assert**: Structure tests clearly
6. **Mock External Dependencies**: Don't hit real database/API

## Continuous Integration

Tests run automatically on:
- Pull requests
- Merge to main branch
- Daily scheduled builds

## Troubleshooting

### Tests Failing Due to Timeouts
```bash
# Increase timeout
npx jest --testTimeout=30000
```

### Tests Failing Due to Environment
```bash
# Check environment
node -e "console.log(process.env.NODE_ENV)"

# Should print 'test'
```

### Mock Not Working
Ensure mock is defined before importing the module:
```typescript
// ✅ Correct
jest.mock('../../../src/models/User', () => mockUserModel);
import { UserService } from '../../../src/services/UserService';

// ❌ Incorrect
import { UserService } from '../../../src/services/UserService';
jest.mock('../../../src/models/User', () => mockUserModel);
```
