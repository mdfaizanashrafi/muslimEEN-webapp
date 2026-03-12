/**
 * FAQ Schema Component
 * 
 * Implements FAQPage schema for rich search results.
 * Helps Google display expandable FAQ sections in search results.
 * 
 * @see https://schema.org/FAQPage
 */

import SchemaInjector from '@/components/seo/SchemaInjector';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSchemaProps {
  items: FAQItem[];
}

/**
 * FAQ Schema Component
 * 
 * Usage:
 * ```tsx
 * <FAQSchema
 *   items={[
 *     { 
 *       question: 'What is MuslimEEN?', 
 *       answer: 'MuslimEEN is a professional networking platform...' 
 *     },
 *   ]}
 * />
 * ```
 * 
 * Note: Google requires at least 2 FAQ items for rich results.
 * Each answer should be a complete sentence or paragraph.
 */
export default function FAQSchema({ items }: FAQSchemaProps) {
  if (items.length < 2) {
    console.warn('FAQSchema: Google requires at least 2 FAQ items for rich results');
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return <SchemaInjector schema={schema} />;
}

/**
 * Pre-defined FAQ sets for common pages
 */

export const homepageFAQs: FAQItem[] = [
  {
    question: 'What is MuslimEEN?',
    answer: 'MuslimEEN (Muslim Economic Empowerment Network) is an invitation-only professional networking platform for the Muslim community. It combines professional networking with Islamic finance tools in a trust-based ecosystem, helping Muslims connect for jobs, business partnerships, and community wealth building.',
  },
  {
    question: 'How does the trust score system work?',
    answer: 'Every member has a trust score from 0-1000 based on community participation, verification status, and peer endorsements. Members with scores above 800 are considered highly trusted and can serve as witnesses for new member verification.',
  },
  {
    question: 'Is MuslimEEN free to use?',
    answer: 'Yes, MuslimEEN is completely free for individual users. We sustain operations through B2B services like conference hosting, recruitment services, and white-label verification. All surplus revenue is directed to a community Waqf (perpetual charity).',
  },
  {
    question: 'How do I join MuslimEEN?',
    answer: 'MuslimEEN is invitation-only to maintain community quality. You need an invitation from two existing verified members who can vouch for your Muslim identity. Once invited, you complete biometric verification and build your trust score through positive participation.',
  },
  {
    question: 'What makes MuslimEEN different from LinkedIn?',
    answer: 'Unlike LinkedIn, MuslimEEN has no advertising, never sells user data, is open source forever, and operates without interest-based finance. We verify all members are Muslim through two-witness attestation, creating a trusted community for Islamic economic collaboration.',
  },
];

export const verificationFAQs: FAQItem[] = [
  {
    question: 'What is two-witness verification?',
    answer: 'Two-witness verification is an Islamic tradition where two trusted community members vouch for a person\'s identity and Muslim faith. On MuslimEEN, witnesses must have a trust score above 800 and can only witness for people they know personally.',
  },
  {
    question: 'How long does verification take?',
    answer: 'The verification process typically takes 1-3 business days. After submitting your application and biometric data, two verified members will review and attest to your identity. You\'ll be notified once verification is complete.',
  },
  {
    question: 'What is biometric verification?',
    answer: 'Biometric verification creates a unique hash from your fingerprint or facial scan. This hash is tied to your reputation, making it impossible to create multiple accounts or transfer your identity. We never store actual biometric images, only irreversible hashes.',
  },
  {
    question: 'Can non-Muslims join MuslimEEN?',
    answer: 'Non-Muslims can join in "consumer mode" with limited features. They can browse public listings and connect with businesses, but cannot participate in Islamic finance tools, governance, or verification systems. This ensures our community remains authentic while being inclusive.',
  },
];

export const islamicFinanceFAQs: FAQItem[] = [
  {
    question: 'What Islamic finance tools does MuslimEEN offer?',
    answer: 'MuslimEEN provides Zakat calculator, Sadaqah (charity) campaigns, Waqf (endowment) explorer, Qard Hasan (interest-free loans), and Takaful (Islamic insurance) information. All tools are designed to be fully Shariah-compliant.',
  },
  {
    question: 'Is the Zakat calculator accurate?',
    answer: 'Our Zakat calculator follows classical Hanafi and Maliki methodologies for calculating Zakat on cash, gold, silver, and business assets. For complex situations like stocks and retirement accounts, we recommend consulting with a qualified Islamic scholar.',
  },
  {
    question: 'What is Qard Hasan?',
    answer: 'Qard Hasan (benevolent loan) is an interest-free loan given to help someone in need. On MuslimEEN, community members can offer or request Qard Hasan loans. The borrower only repays the principal amount, with no interest or fees.',
  },
  {
    question: 'How do Sadaqah campaigns work?',
    answer: 'Verified members and organizations can create Sadaqah campaigns for charitable causes. Donors can browse campaigns, view verification status of organizers, and donate directly. 100% of donations go to the cause - MuslimEEN takes no commission.',
  },
];
