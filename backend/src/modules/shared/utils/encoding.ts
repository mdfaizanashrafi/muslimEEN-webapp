/**
 * Output Encoding Utilities
 * Ensures all API responses are properly encoded to prevent XSS
 * SECURITY: Defense in depth - encode on output even if input was sanitized
 */

// ============================================================================
// HTML ENCODING
// ============================================================================

/**
 * Encode string for safe HTML display
 * Converts special characters to HTML entities
 */
export const encodeForHtml = (input: string | null | undefined): string => {
  if (input === null || input === undefined) {
    return '';
  }
  
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Encode string for HTML attribute context
 * More aggressive encoding for attribute values
 */
export const encodeForHtmlAttribute = (input: string | null | undefined): string => {
  if (input === null || input === undefined) {
    return '';
  }
  
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/`/g, '&#x60;')
    .replace(/=/g, '&#x3D;')
    .replace(/\(/g, '&#x28;')
    .replace(/\)/g, '&#x29;');
};

// ============================================================================
// JAVASCRIPT ENCODING
// ============================================================================

/**
 * Encode string for safe JavaScript context
 * Use when inserting data into JavaScript strings
 */
export const encodeForJavaScript = (input: string | null | undefined): string => {
  if (input === null || input === undefined) {
    return '';
  }
  
  return String(input)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e');
};

// ============================================================================
// URL ENCODING
// ============================================================================

/**
 * Encode string for URL context
 */
export const encodeForUrl = (input: string | null | undefined): string => {
  if (input === null || input === undefined) {
    return '';
  }
  
  return encodeURIComponent(String(input));
};

// ============================================================================
// CSS ENCODING
// ============================================================================

/**
 * Encode string for CSS context
 * Prevents CSS injection attacks
 */
export const encodeForCss = (input: string | null | undefined): string => {
  if (input === null || input === undefined) {
    return '';
  }
  
  return String(input)
    .replace(/</g, '\\3c ')
    .replace(/>/g, '\\3e ')
    .replace(/"/g, '\\22 ')
    .replace(/'/g, '\\27 ')
    .replace(/\(/g, '\\28 ')
    .replace(/\)/g, '\\29 ')
    .replace(/&/g, '\\26 ');
};

// ============================================================================
// JSON SAFETY
// ============================================================================

/**
 * Safely encode object to JSON
 * Prevents prototype pollution in JSON output
 */
export const safeJsonStringify = (obj: any): string => {
  // Remove dangerous keys before stringification
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  
  const sanitizeObject = (value: any): any => {
    if (typeof value !== 'object' || value === null) {
      return value;
    }
    
    if (Array.isArray(value)) {
      return value.map(sanitizeObject);
    }
    
    const sanitized: any = {};
    for (const [key, val] of Object.entries(value)) {
      if (!dangerousKeys.includes(key)) {
        sanitized[key] = sanitizeObject(val);
      }
    }
    return sanitized;
  };
  
  return JSON.stringify(sanitizeObject(obj));
};

// ============================================================================
// DEEP ENCODING
// ============================================================================

/**
 * Deep encode all string values in an object for HTML context
 * Use when preparing API responses that will be rendered in HTML
 */
export const deepEncodeForHtml = <T>(obj: T): T => {
  if (typeof obj === 'string') {
    return encodeForHtml(obj) as unknown as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepEncodeForHtml(item)) as unknown as T;
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const encoded: any = {};
    for (const [key, value] of Object.entries(obj)) {
      encoded[key] = deepEncodeForHtml(value);
    }
    return encoded;
  }
  
  return obj;
};

// ============================================================================
// RESPONSE SANITIZATION
// ============================================================================

/**
 * Fields that should never be included in API responses
 */
const SENSITIVE_RESPONSE_FIELDS = [
  'password',
  'passwordHash',
  'password_hash',
  'token',
  'refreshToken',
  'csrfToken',
  'secret',
  'apiKey',
  'api_key',
  'privateKey',
  'private_key',
];

/**
 * Remove sensitive fields from response object
 */
export const removeSensitiveFields = <T>(obj: T): Partial<T> => {
  if (typeof obj !== 'object' || obj === null) {
    return obj as Partial<T>;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => removeSensitiveFields(item)) as unknown as Partial<T>;
  }
  
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip sensitive fields
    if (SENSITIVE_RESPONSE_FIELDS.some(field => 
      key.toLowerCase().includes(field.toLowerCase())
    )) {
      continue;
    }
    
    cleaned[key] = removeSensitiveFields(value);
  }
  
  return cleaned;
};

/**
 * Sanitize API response
 * Removes sensitive fields and optionally encodes output
 */
export const sanitizeResponse = <T>(
  obj: T,
  options: { encodeHtml?: boolean; removeSensitive?: boolean } = {}
): T => {
  let result = obj;
  
  if (options.removeSensitive !== false) {
    result = removeSensitiveFields(result) as T;
  }
  
  if (options.encodeHtml) {
    result = deepEncodeForHtml(result) as T;
  }
  
  return result;
};
