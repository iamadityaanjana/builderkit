import React from 'react';
import SmartProfile from '../components/SmartProfile';

const SmartProfilePage: React.FC = () => {
  // Example custom fields configuration
  const customFields = [
    {
      key: 'bio',
      label: 'Bio',
      type: 'textarea' as const,
      placeholder: 'Tell us about yourself...',
      required: false
    },
    {
      key: 'age',
      label: 'Age',
      type: 'text' as const,
      placeholder: 'Your age',
      required: false
    },
    {
      key: 'location',
      label: 'Location',
      type: 'text' as const,
      placeholder: 'City, Country',
      required: false
    },
    {
      key: 'website',
      label: 'Website',
      type: 'url' as const,
      placeholder: 'https://yourwebsite.com',
      required: false
    },
    {
      key: 'email',
      label: 'Email',
      type: 'email' as const,
      placeholder: 'your@email.com',
      required: false
    },
    {
      key: 'profession',
      label: 'Profession',
      type: 'text' as const,
      placeholder: 'What do you do?',
      required: false
    }
  ];

      return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '32px 16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        textAlign: 'center' as const,
        marginBottom: '24px'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#000000',
          margin: '0 0 8px'
        }}>User Profile Demo</h1>
        <p style={{
          fontSize: '14px',
          color: '#666666',
          margin: '0 0 16px'
        }}>
          Showcasing customizable profile fields
        </p>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        {/* Basic Profile */}
        <div>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#000000',
            margin: '0 0 12px',
            textAlign: 'center' as const
          }}>Basic Profile</h3>
          <SmartProfile />
        </div>

        {/* Extended Profile */}
        <div>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#000000',
            margin: '0 0 12px',
            textAlign: 'center' as const
          }}>Extended Profile</h3>
          <SmartProfile customFields={customFields} />
        </div>

        {/* Developer Profile */}
        <div>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#000000',
            margin: '0 0 12px',
            textAlign: 'center' as const
          }}>Developer Profile</h3>
          <SmartProfile customFields={[
            {
              key: 'githubUsername',
              label: 'GitHub Username',
              type: 'text' as const,
              placeholder: '@yourusername',
              required: true
            },
            {
              key: 'skills',
              label: 'Skills',
              type: 'textarea' as const,
              placeholder: 'JavaScript, React, Blockchain...',
              required: false
            },
            {
              key: 'portfolio',
              label: 'Portfolio Website',
              type: 'url' as const,
              placeholder: 'https://portfolio.com',
              required: false
            },
            {
              key: 'experience',
              label: 'Years of Experience',
              type: 'text' as const,
              placeholder: '5 years',
              required: false
            }
          ]} />
        </div>
      </div>
    </div>
  );
};

export default SmartProfilePage;
