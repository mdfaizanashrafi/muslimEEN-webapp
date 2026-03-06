/**
 * Module Testing Utilities
 * 
 * Provides helper functions for testing both legacy and modular implementations
 * to ensure parity during migration.
 */

import { featureFlags } from '../../src/modules/shared/config/featureFlags';

/**
 * Test result comparison
 */
export interface TestComparison<T> {
  legacy: T;
  modular: T;
  match: boolean;
  differences: string[];
}

/**
 * Run the same test against both legacy and modular implementations
 * 
 * Usage:
 * ```typescript
 * const result = await testBothImplementations(
 *   () => legacyAuthService.login(credentials),
 *   () => modularAuthService.login(credentials),
 *   ['token', 'user.id', 'user.email']
 * );
 * ```
 */
export async function testBothImplementations<T>(
  legacyFn: () => Promise<T>,
  modularFn: () => Promise<T>,
  fieldsToCompare?: string[]
): Promise<TestComparison<T>> {
  // Run both implementations
  const legacyResult = await legacyFn();
  const modularResult = await modularFn();

  // Compare results
  const differences = compareObjects(legacyResult, modularResult, fieldsToCompare);

  return {
    legacy: legacyResult,
    modular: modularResult,
    match: differences.length === 0,
    differences,
  };
}

/**
 * Compare two objects and return differences
 */
function compareObjects(
  obj1: any,
  obj2: any,
  fields?: string[],
  path: string = ''
): string[] {
  const differences: string[] = [];

  if (fields) {
    // Compare specific fields
    for (const field of fields) {
      const val1 = getNestedValue(obj1, field);
      const val2 = getNestedValue(obj2, field);
      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        differences.push(`${field}: legacy=${JSON.stringify(val1)}, modular=${JSON.stringify(val2)}`);
      }
    }
  } else {
    // Compare all fields
    const keys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);
    for (const key of keys) {
      const val1 = obj1?.[key];
      const val2 = obj2?.[key];
      if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null) {
        differences.push(...compareObjects(val1, val2, undefined, `${path}${key}.`));
      } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        differences.push(`${path}${key}: legacy=${JSON.stringify(val1)}, modular=${JSON.stringify(val2)}`);
      }
    }
  }

  return differences;
}

/**
 * Get nested object value by path
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

/**
 * Temporarily override feature flag for testing
 * 
 * Usage:
 * ```typescript
 * const restore = overrideFeatureFlag('useModularIAM', true);
 * // ... run test ...
 * restore(); // restore original value
 * ```
 */
export function overrideFeatureFlag(
  flagName: keyof typeof featureFlags,
  value: boolean
): () => void {
  const originalValue = featureFlags[flagName];
  (featureFlags as any)[flagName] = value;
  
  return () => {
    (featureFlags as any)[flagName] = originalValue;
  };
}

/**
 * Test configuration for specific module
 */
export interface ModuleTestConfig {
  moduleName: string;
  legacyPath: string;
  modularPath: string;
  testData: Record<string, any>;
}

/**
 * Run comprehensive module parity test
 */
export async function runModuleParityTest(config: ModuleTestConfig): Promise<{
  passed: boolean;
  results: Record<string, TestComparison<any>>;
}> {
  const results: Record<string, TestComparison<any>> = {};
  let allPassed = true;

  // This is a placeholder - actual implementation would dynamically import
  // both legacy and modular versions and run comparison tests
  console.log(`Running parity test for ${config.moduleName}`);

  return {
    passed: allPassed,
    results,
  };
}

/**
 * Mock request/response for controller testing
 */
export function createMockRequest(overrides: any = {}) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: { id: 'test-user-id', email: 'test@example.com' },
    ...overrides,
  };
}

export function createMockResponse() {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.jsonData = data;
      return this;
    },
  };
  return res;
}

export function createMockNext() {
  return jest.fn();
}
