import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';

interface PromotionalEmailProps {
  userEmail?: string;
  repositoryUrl?: string;
  repositoryStars?: string;
}

export const PromotionalEmail = ({
  userEmail = 'teams@codinit.dev',
  repositoryUrl = 'https://github.com/Gerome-Elassaad/codinit-app',
  repositoryStars = '16+',
}: PromotionalEmailProps) => {
  const previewText = `Build Full-Stack Apps with AI - Star CodinIT on GitHub!`;

  const features = [
    {
      icon: '⚡',
      title: '19+ AI Providers',
      description: 'OpenAI, Anthropic, Google, Mistral, Cohere, DeepSeek, and more.',
      color: '#8b5cf6',
    },
    {
      icon: '🖥️',
      title: 'In-Browser Runtime',
      description: 'WebContainer API - run Node.js directly in your browser.',
      color: '#06b6d4',
    },
    {
      icon: '💻',
      title: 'Desktop & Web',
      description: 'Electron app for Windows, macOS, Linux, plus web version.',
      color: '#10b981',
    },
    {
      icon: '🔌',
      title: 'MCP Integration',
      description: 'Model Context Protocol for enhanced AI capabilities.',
      color: '#f59e0b',
    },
  ];

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Hero Bento Section */}
          <Section>
            <Row style={heroRow}>
              <Column style={heroTextColumn}>
                <Heading as="h1" style={heroHeading}>
                  Thank You for Using CodinIT! 🚀
                </Heading>
                <Text style={heroText}>
                  Build full-stack applications with AI-powered development. Your support means the world to us!
                </Text>
                <Link href={repositoryUrl} style={heroLink}>
                  Star on GitHub →
                </Link>
              </Column>
              <Column style={heroImageColumn}>
                <Img
                  src="https://raw.githubusercontent.com/Gerome-Elassaad/codinit-app/main/readme_assets/readme.png"
                  alt="CodinIT Interface"
                  style={heroImage}
                />
              </Column>
            </Row>
          </Section>

          {/* Features Bento Grid */}
          <Section style={bentoSection}>
            <Heading as="h2" style={sectionHeading}>
              Why Users Love CodinIT
            </Heading>
            <Row style={bentoRow}>
              {features.slice(0, 2).map((feature) => (
                <Column key={feature.title} style={bentoCard}>
                  <div style={bentoCardInner}>
                    <Text style={{ ...featureIcon, backgroundColor: feature.color }}>{feature.icon}</Text>
                    <Heading as="h3" style={featureTitle}>
                      {feature.title}
                    </Heading>
                    <Text style={featureDescription}>{feature.description}</Text>
                  </div>
                </Column>
              ))}
            </Row>
            <Row style={bentoRow}>
              {features.slice(2, 4).map((feature) => (
                <Column key={feature.title} style={bentoCard}>
                  <div style={bentoCardInner}>
                    <Text style={{ ...featureIcon, backgroundColor: feature.color }}>{feature.icon}</Text>
                    <Heading as="h3" style={featureTitle}>
                      {feature.title}
                    </Heading>
                    <Text style={featureDescription}>{feature.description}</Text>
                  </div>
                </Column>
              ))}
            </Row>
          </Section>

          {/* Full-width Feature Highlight */}
          <Section style={fullWidthSection}>
            <div style={fullWidthCard}>
              <Heading as="h2" style={fullWidthHeading}>
                📦 Production-Ready Architecture
              </Heading>
              <Text style={fullWidthText}>
                Built with Remix, React 18, TypeScript 5, and Vite. Includes CodeMirror 6 editor, xterm.js terminal, and
                WebContainer runtime. Deploy to Cloudflare Pages, Vercel, or Netlify.
              </Text>
            </div>
          </Section>

          {/* CTA Section */}
          <Section style={ctaSection}>
            <Hr style={hr} />
            <Heading as="h2" style={ctaHeading}>
              Support Open Source Development
            </Heading>
            <Text style={ctaText}>
              CodinIT is completely free and open source. If you find it valuable, please star our repository on GitHub.
              Your star helps us:
            </Text>
            <ul style={benefitsList}>
              <li style={benefitItem}>✨ Gain visibility in the developer community</li>
              <li style={benefitItem}>🤝 Attract contributors to improve the project</li>
              <li style={benefitItem}>💪 Stay motivated to add new features</li>
              <li style={benefitItem}>🌟 Help other developers discover CodinIT</li>
            </ul>

            <Section style={buttonSection}>
              <Button style={starButton} href={repositoryUrl}>
                ⭐ Star New Version of CodinIT on GitHub
              </Button>
            </Section>

            <Text style={statsText}>Join {repositoryStars} developers who have already starred the project!</Text>
          </Section>

          {/* Community Grid */}
          <Section style={communitySection}>
            <Hr style={hr} />
            <Heading as="h2" style={sectionHeading}>
              Get Involved
            </Heading>
            <Row style={communityRow}>
              <Column style={communityCard}>
                <Text style={communityIcon}>📖</Text>
                <Link href="https://docs.codinit.dev" style={communityLink}>
                  Documentation
                </Link>
                <Text style={communityDescription}>Explore guides and API docs</Text>
              </Column>
              <Column style={communityCard}>
                <Text style={communityIcon}>🐛</Text>
                <Link href={`${repositoryUrl}/issues`} style={communityLink}>
                  Report Issues
                </Link>
                <Text style={communityDescription}>Help us improve</Text>
              </Column>
              <Column style={communityCard}>
                <Text style={communityIcon}>💬</Text>
                <Link href={`${repositoryUrl}/discussions`} style={communityLink}>
                  Discussions
                </Link>
                <Text style={communityDescription}>Join the conversation</Text>
              </Column>
            </Row>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={hr} />
            <Text style={footerText}>CodinIT - AI-Powered Full-Stack Development Platform</Text>
            <Text style={footerText}>
              Built with ❤️ by{' '}
              <Link href="mailto:gerome.e24@gmail.com" style={footerLink}>
                Gerome Elassaad
              </Link>
            </Text>
            <Text style={footerText}>Licensed under MIT • Open Source</Text>
            <Text style={footerSmall}>You're receiving this email because you used CodinIT ({userEmail}).</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

PromotionalEmail.PreviewProps = {
  userEmail: 'teams@codinit.dev',
  repositoryUrl: 'https://github.com/Gerome-Elassaad/codinit-app',
  repositoryStars: '16+',
} as PromotionalEmailProps;

export default PromotionalEmail;

// Styles
const main = {
  backgroundColor: '#f3f4f6',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  maxWidth: '600px',
  borderRadius: '8px',
  overflow: 'hidden',
};

// Hero Section
const heroRow = {
  backgroundColor: 'rgb(99, 102, 241)',
  margin: '0',
  padding: '32px 24px',
};

const heroTextColumn = {
  paddingRight: '12px',
  verticalAlign: 'middle' as const,
};

const heroImageColumn = {
  width: '42%',
  verticalAlign: 'middle' as const,
};

const heroHeading = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '700',
  lineHeight: '1.2',
  margin: '0 0 16px 0',
};

const heroText = {
  color: 'rgba(255, 255, 255, 0.9)',
  fontSize: '15px',
  lineHeight: '1.5',
  margin: '0 0 20px 0',
};

const heroLink = {
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'inline-block',
};

const heroImage = {
  borderRadius: '6px',
  height: '100%',
  objectFit: 'cover' as const,
  objectPosition: 'center' as const,
  width: '100%',
};

// Bento Grid Section
const bentoSection = {
  padding: '32px 24px 0',
};

const sectionHeading = {
  color: '#1f2937',
  fontSize: '22px',
  fontWeight: '600',
  margin: '0 0 20px 0',
  textAlign: 'center' as const,
};

const bentoRow = {
  margin: '0 0 12px 0',
};

const bentoCard = {
  width: '50%',
  padding: '0 6px',
};

const bentoCardInner = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '20px',
  border: '1px solid #e5e7eb',
  minHeight: '140px',
};

const featureIcon = {
  fontSize: '28px',
  width: '56px',
  height: '56px',
  borderRadius: '12px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 0 12px 0',
  textAlign: 'center' as const,
  lineHeight: '56px',
};

const featureTitle = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const featureDescription = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '1.4',
  margin: '0',
};

// Full-width feature
const fullWidthSection = {
  padding: '12px 24px 32px',
};

const fullWidthCard = {
  backgroundColor: 'rgb(245, 243, 255)',
  borderRadius: '8px',
  padding: '24px',
  border: '1px solid rgb(221, 214, 254)',
};

const fullWidthHeading = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const fullWidthText = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
};

// CTA Section
const ctaSection = {
  padding: '0 32px 24px',
};

const ctaHeading = {
  color: '#1f2937',
  fontSize: '22px',
  fontWeight: '600',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
};

const ctaText = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
};

const benefitsList = {
  listStyle: 'none',
  padding: '0',
  margin: '0 0 24px 0',
};

const benefitItem = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '1.8',
  margin: '0 0 8px 0',
  textAlign: 'center' as const,
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

const starButton = {
  backgroundColor: '#6366f1',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 40px',
  boxShadow: '0 4px 6px rgba(99, 102, 241, 0.25)',
};

const statsText = {
  textAlign: 'center' as const,
  color: '#6b7280',
  fontSize: '14px',
  fontStyle: 'italic',
  margin: '0',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
};

// Community Section
const communitySection = {
  padding: '0 32px 32px',
};

const communityRow = {
  margin: '0',
};

const communityCard = {
  width: '33.33%',
  padding: '0 8px',
  textAlign: 'center' as const,
};

const communityIcon = {
  fontSize: '32px',
  margin: '0 0 12px 0',
};

const communityLink = {
  color: '#6366f1',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'block',
  margin: '0 0 4px 0',
};

const communityDescription = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '0',
};

// Footer
const footer = {
  padding: '0 32px 32px',
};

const footerText = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0 0 8px 0',
  textAlign: 'center' as const,
};

const footerLink = {
  color: '#6366f1',
  textDecoration: 'none',
};

const footerSmall = {
  color: '#9ca3af',
  fontSize: '11px',
  lineHeight: '1.4',
  margin: '16px 0 0',
  textAlign: 'center' as const,
};
