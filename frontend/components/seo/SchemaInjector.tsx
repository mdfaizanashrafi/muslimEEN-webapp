/**
 * SchemaInjector - Server Component for JSON-LD Structured Data
 * 
 * Injects Schema.org structured data into pages for rich search results.
 * This is a Server Component - no client-side JavaScript.
 */

import { serializeSchema } from '@/lib/seo/metadata';

interface SchemaInjectorProps {
  schema: object | object[];
}

/**
 * SchemaInjector - Renders JSON-LD structured data
 * 
 * Usage:
 * ```tsx
 * import { generateOrganizationSchema } from '@/lib/seo/metadata';
 * 
 * export default function Page() {
 *   return (
 *     <>
 *       <SchemaInjector schema={generateOrganizationSchema()} />
 *       <h1>Page Content</h1>
 *     </>
 *   );
 * }
 * ```
 */
export default function SchemaInjector({ schema }: SchemaInjectorProps) {
  const schemas = Array.isArray(schema) ? schema : [schema];
  
  return (
    <>
      {schemas.map((s, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeSchema(s),
          }}
        />
      ))}
    </>
  );
}
