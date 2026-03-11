'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import '@/styles/verification.css';

/**
 * Institutional Partner Verification Form
 * 
 * This page allows mosques, madaris, and Islamic organizations
 * to apply for institutional partnership verification.
 * 
 * INSTITUTION TYPES:
 * - Mosque (Masjid)
 * - Islamic School (Madrasa)
 * - Islamic Organization
 * - Charity/NGO
 * - University Islamic Society
 * - Professional Association
 */

const institutionTypes = [
  { value: 'mosque', label: 'Mosque (Masjid)', icon: '🕌' },
  { value: 'madrasa', label: 'Islamic School (Madrasa)', icon: '📚' },
  { value: 'organization', label: 'Islamic Organization', icon: '🏛️' },
  { value: 'charity', label: 'Charity / NGO', icon: '❤️' },
  { value: 'university_society', label: 'University Islamic Society', icon: '🎓' },
  { value: 'professional', label: 'Professional Association', icon: '💼' },
];

const documentRequirements: Record<string, string[]> = {
  mosque: [
    'Mosque registration certificate',
    'Charity commission registration (if applicable)',
    'Letter from board of trustees',
    'Proof of address (utility bill or lease)',
  ],
  madrasa: [
    'School registration certificate',
    'Accreditation documents',
    'Curriculum overview',
    'Safeguarding policy',
  ],
  organization: [
    'Organization registration certificate',
    'Governing documents (constitution/bylaws)',
    'Annual report or financial statements',
    'Board/trustee list',
  ],
  charity: [
    'Charity registration certificate',
    '501(c)(3) or equivalent tax exemption letter',
    'Annual financial report',
    'Board of directors list',
  ],
  university_society: [
    'University recognition letter',
    'Constitution or bylaws',
    'Executive committee list',
    'Student union affiliation (if applicable)',
  ],
  professional: [
    'Professional body registration',
    'Membership criteria documentation',
    'Leadership structure',
    'Code of conduct/ethics',
  ],
};

const InstitutionIcon = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 21h18"/>
    <path d="M5 21V7l8-4 8 4v14"/>
    <path d="M9 21v-6h6v6"/>
  </svg>
);

const UploadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17,8 12,3 7,8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

export default function InstitutionalPartnerPage() {
  const [selectedType, setSelectedType] = useState<string>('');
  const [formData, setFormData] = useState({
    institutionName: '',
    website: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    registrationNumber: '',
    yearEstablished: '',
    description: '',
    documents: [] as File[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, ...Array.from(e.target.files!)],
      }));
    }
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: API integration
    // const formDataToSend = new FormData();
    // formDataToSend.append('institutionType', selectedType);
    // Object.entries(formData).forEach(([key, value]) => {
    //   if (key === 'documents') {
    //     formData.documents.forEach(file => formDataToSend.append('documents', file));
    //   } else {
    //     formDataToSend.append(key, value);
    //   }
    // });
    // await api.post('/verification/institutional/apply', formDataToSend);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setSubmitSuccess(true);
  };

  const requiredDocs = selectedType ? documentRequirements[selectedType] : [];

  if (submitSuccess) {
    return (
      <AppLayout activeNav="verification">
        <div className="verification-page">
          <div className="page-header">
            <Link href="/verification" className="back-link">
              ← Back to Verification
            </Link>
            <h1>Application Submitted</h1>
            <p className="subtitle">Your institutional partner application has been received</p>
          </div>

          <div className="success-card">
            <div className="success-icon">✓</div>
            <h2 className="success-title">Thank You!</h2>
            <p className="success-message">
              Your application for institutional partner verification has been submitted successfully.
              Our team will review your documents and respond within 5-7 business days.
            </p>
            <div className="success-details">
              <p><strong>Reference Number:</strong> INST-{Date.now().toString(36).toUpperCase()}</p>
              <p><strong>Institution:</strong> {formData.institutionName}</p>
              <p><strong>Type:</strong> {institutionTypes.find(t => t.value === selectedType)?.label}</p>
            </div>
            <Link href="/verification" className="btn btn-primary mt-4">
              Return to Verification
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeNav="verification">
      <div className="verification-page">
        {/* Page Header */}
        <div className="page-header">
          <Link href="/verification" className="back-link">
            ← Back to Verification
          </Link>
          <h1>Institutional Partner</h1>
          <p className="subtitle">Apply for institutional verification</p>
        </div>

        {/* Institution Type Selection */}
        {!selectedType ? (
          <div className="institution-type-section">
            <h2 className="section-title">Select Institution Type</h2>
            <div className="institution-type-grid">
              {institutionTypes.map((type) => (
                <button
                  key={type.value}
                  className="institution-type-card"
                  onClick={() => setSelectedType(type.value)}
                >
                  <span className="institution-icon">{type.icon}</span>
                  <span className="institution-label">{type.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="institutional-form">
            {/* Institution Type Display */}
            <div className="selected-type-bar">
              <span>
                {institutionTypes.find(t => t.value === selectedType)?.icon}{' '}
                {institutionTypes.find(t => t.value === selectedType)?.label}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedType('')}
              >
                Change
              </button>
            </div>

            {/* Institution Details */}
            <div className="form-section">
              <h3 className="form-section-title">Institution Details</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Institution Name *</label>
                  <input
                    type="text"
                    name="institutionName"
                    value={formData.institutionName}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    placeholder="e.g., Islamic Center of Excellence"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="https://www.example.org"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Year Established</label>
                  <input
                    type="number"
                    name="yearEstablished"
                    value={formData.yearEstablished}
                    onChange={handleInputChange}
                    className="form-input"
                    min="1900"
                    max={new Date().getFullYear()}
                    placeholder="e.g., 2010"
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Registration Number *</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    placeholder="Official registration number"
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="form-textarea"
                    required
                    rows={4}
                    placeholder="Brief description of your institution's mission and activities..."
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="form-section">
              <h3 className="form-section-title">Address</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Street Address *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Postal/ZIP Code *</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Country *</label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    <option value="">Select country</option>
                    <option value="US">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                    <option value="PK">Pakistan</option>
                    <option value="BD">Bangladesh</option>
                    <option value="IN">India</option>
                    <option value="TR">Turkey</option>
                    <option value="SA">Saudi Arabia</option>
                    <option value="AE">UAE</option>
                    <option value="MY">Malaysia</option>
                    <option value="ID">Indonesia</option>
                    <option value="EG">Egypt</option>
                    <option value="NG">Nigeria</option>
                    <option value="ZA">South Africa</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="form-section">
              <h3 className="form-section-title">Primary Contact</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Contact Name *</label>
                  <input
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    placeholder="Full name"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Email *</label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    placeholder="official@institution.org"
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Contact Phone *</label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Document Upload */}
            <div className="form-section">
              <h3 className="form-section-title">Required Documents</h3>
              <p className="form-section-description">
                Please upload the following documents for verification:
              </p>
              <ul className="required-docs-list">
                {requiredDocs.map((doc, index) => (
                  <li key={index}>{doc}</li>
                ))}
              </ul>

              <div className="document-upload-area">
                <input
                  type="file"
                  id="documents"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="documents" className="upload-label">
                  <UploadIcon />
                  <span>Click to upload documents</span>
                  <small>PDF, JPG, or PNG (max 10MB each)</small>
                </label>
              </div>

              {formData.documents.length > 0 && (
                <div className="uploaded-documents">
                  <h4>Uploaded Documents ({formData.documents.length})</h4>
                  <ul className="document-list">
                    {formData.documents.map((file, index) => (
                      <li key={index} className="document-item">
                        <span className="document-name">{file.name}</span>
                        <span className="document-size">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm text-red"
                          onClick={() => removeDocument(index)}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="form-actions">
              <Link href="/verification" className="btn btn-ghost">
                Cancel
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || formData.documents.length === 0}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
