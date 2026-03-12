/**
 * JobPostingSchema - Structured data for job listings
 * 
 * Enables Google Jobs rich results including:
 * - Job title, company, and location
 * - Salary information
 * - Employment type
 * - Direct apply links
 */

import SchemaInjector from '@/components/seo/SchemaInjector';

interface JobPostingSchemaProps {
  title: string;
  description: string;
  company: string;
  companyLogo?: string;
  location: string;
  slug: string;
  datePosted: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR' | 'TEMPORARY' | 'INTERN';
  salary?: {
    min?: number;
    max?: number;
    currency: string;
    unit: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
  };
  qualifications?: string;
  responsibilities?: string;
  benefits?: string[];
  applicationUrl?: string;
  validThrough?: string;
  remoteStatus?: 'TELECOMMUTE' | 'ONSITE' | 'HYBRID';
}

/**
 * Job Posting Schema Component
 * 
 * Required properties for Google Jobs:
 * - title
 * - description
 * - datePosted
 * - hiringOrganization
 * - jobLocation
 * 
 * Recommended:
 * - baseSalary
 * - employmentType
 * - validThrough
 */
export default function JobPostingSchema({
  title,
  description,
  company,
  companyLogo,
  location,
  slug,
  datePosted,
  employmentType,
  salary,
  qualifications,
  responsibilities,
  benefits,
  applicationUrl,
  validThrough,
  remoteStatus,
}: JobPostingSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://muslimeen.space';
  
  const schema: {
    '@context': 'https://schema.org';
    '@type': 'JobPosting';
    title: string;
    description: string;
    identifier: {
      '@type': 'PropertyValue';
      name: string;
      value: string;
    };
    datePosted: string;
    validThrough?: string;
    hiringOrganization: {
      '@type': 'Organization';
      name: string;
      logo?: string;
    };
    jobLocation: {
      '@type': 'Place';
      address: {
        '@type': 'PostalAddress';
        addressLocality: string;
      };
    };
    jobLocationType?: 'TELECOMMUTE';
    employmentType: string;
    baseSalary?: {
      '@type': 'MonetaryAmount';
      currency: string;
      value: {
        '@type': 'QuantitativeValue';
        minValue?: number;
        maxValue?: number;
        unitText: string;
      };
    };
    qualifications?: string;
    responsibilities?: string;
    jobBenefits?: string;
    directApply?: boolean;
    url?: string;
  } = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title,
    description,
    identifier: {
      '@type': 'PropertyValue',
      name: company,
      value: slug,
    },
    datePosted,
    hiringOrganization: {
      '@type': 'Organization',
      name: company,
      ...(companyLogo && { logo: companyLogo }),
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: location,
      },
    },
    employmentType,
    url: `${baseUrl}/marketplace/earn/${slug}`,
    directApply: true,
  };

  // Optional properties
  if (validThrough) {
    schema.validThrough = validThrough;
  }

  if (remoteStatus === 'TELECOMMUTE') {
    schema.jobLocationType = 'TELECOMMUTE';
  }

  if (salary) {
    schema.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: salary.currency,
      value: {
        '@type': 'QuantitativeValue',
        ...(salary.min !== undefined && { minValue: salary.min }),
        ...(salary.max !== undefined && { maxValue: salary.max }),
        unitText: salary.unit,
      },
    };
  }

  if (qualifications) {
    schema.qualifications = qualifications;
  }

  if (responsibilities) {
    schema.responsibilities = responsibilities;
  }

  if (benefits && benefits.length > 0) {
    schema.jobBenefits = benefits.join(', ');
  }

  return <SchemaInjector schema={schema} />;
}
