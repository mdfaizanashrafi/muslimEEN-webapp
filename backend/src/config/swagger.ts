/**
 * Swagger/OpenAPI Configuration
 * MuslimEEN API Documentation Setup
 */

import path from 'path';
import YAML from 'yamljs';

// Load the OpenAPI specification from YAML file
const openapiPath = path.join(__dirname, '..', 'openapi.yaml');

/**
 * Swagger/OpenAPI specification object
 * Loaded from openapi.yaml file
 */
export const swaggerSpec = YAML.load(openapiPath);

/**
 * Swagger UI options for customization
 */
export const swaggerUiOptions = {
  explorer: true,
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #059669 }
    .swagger-ui .scheme-container { background: #f9fafb }
  `,
  customSiteTitle: 'MuslimEEN API Documentation',
  customfavIcon: '/favicon.ico',
};

/**
 * Get Swagger specification (for use in routes)
 * @returns The OpenAPI specification object
 */
export function getSwaggerSpec(): Record<string, unknown> {
  return swaggerSpec;
}

export default swaggerSpec;
