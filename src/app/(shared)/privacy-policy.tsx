// ============================================================================
// Privacy Policy Screen
// Scrollable legal page with styled sections, accessible from login & profile
// ============================================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

const EFFECTIVE_DATE = 'May 30, 2026';

interface SectionProps {
  number: string;
  title: string;
  children: React.ReactNode;
}

function Section({ number, title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionNumber}>
          <Text style={styles.sectionNumberText}>{number}</Text>
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <Text style={styles.subHeading}>{children}</Text>;
}

export default function PrivacyPolicyScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>🔒</Text>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <Text style={styles.headerSubtitle}>
            How we collect, use, and protect your personal data
          </Text>
        </View>

        {/* Decorative circles */}
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Effective date badge */}
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeIcon}>📅</Text>
          <Text style={styles.dateBadgeText}>
            Effective Date: {EFFECTIVE_DATE}
          </Text>
        </View>

        <Text style={styles.intro}>
          PaniApp Technologies ("we", "us", or "our") respects your privacy and is committed
          to protecting the personal information you share with us. This Privacy Policy explains
          how we collect, use, disclose, and safeguard your information when you use the PaniApp
          mobile application ("App").
        </Text>

        <Section number="1" title="Information We Collect">
          <SubHeading>Personal Information</SubHeading>
          <Text style={styles.bodyText}>
            When you create an account and use PaniApp, we collect:
          </Text>
          <Bullet>Phone number (used for account verification via OTP)</Bullet>
          <Bullet>Full name as provided during onboarding</Bullet>
          <Bullet>Role selection (worker or recruiter)</Bullet>
          <Bullet>Skills and professional capabilities</Bullet>
          <Bullet>Minimum wage preferences</Bullet>
          <Bullet>UPI ID and payment information</Bullet>

          <SubHeading>Location Data</SubHeading>
          <Text style={styles.bodyText}>
            We collect your device's geographic location to:
          </Text>
          <Bullet>Show jobs available near your current location</Bullet>
          <Bullet>Help recruiters find workers in their vicinity</Bullet>
          <Bullet>Calculate distances between workers and job sites</Bullet>

          <SubHeading>Device Information</SubHeading>
          <Bullet>Device type, operating system, and version</Bullet>
          <Bullet>App version and crash reports</Bullet>
          <Bullet>Language preference</Bullet>

          <SubHeading>Usage Data</SubHeading>
          <Bullet>App usage patterns and feature interactions</Bullet>
          <Bullet>Job application history</Bullet>
          <Bullet>Transaction records</Bullet>
        </Section>

        <Section number="2" title="How We Use Your Information">
          <Text style={styles.bodyText}>
            We use the collected information for the following purposes:
          </Text>
          <Bullet>Account creation, authentication, and management</Bullet>
          <Bullet>Connecting workers with relevant job opportunities</Bullet>
          <Bullet>Enabling recruiters to find qualified workers nearby</Bullet>
          <Bullet>Processing and facilitating payments between users</Bullet>
          <Bullet>Sending job alerts, application updates, and notifications</Bullet>
          <Bullet>Improving app performance and user experience</Bullet>
          <Bullet>Ensuring platform safety and preventing fraud</Bullet>
          <Bullet>Complying with legal obligations</Bullet>
        </Section>

        <Section number="3" title="Information Sharing">
          <Text style={styles.bodyText}>
            We do not sell your personal information. We may share your data in the following
            limited circumstances:
          </Text>

          <SubHeading>With Other Users</SubHeading>
          <Bullet>Workers' profiles (name, skills, ratings) are visible to recruiters</Bullet>
          <Bullet>Recruiters' job postings are visible to nearby workers</Bullet>
          <Bullet>Contact details are shared only after a job is accepted</Bullet>

          <SubHeading>With Service Providers</SubHeading>
          <Bullet>Supabase (database and authentication services)</Bullet>
          <Bullet>UPI payment processors for transaction handling</Bullet>
          <Bullet>Analytics providers for app improvement</Bullet>

          <SubHeading>Legal Requirements</SubHeading>
          <Text style={styles.bodyText}>
            We may disclose your information if required by law, court order, or government
            regulation, or if we believe disclosure is necessary to protect our rights, your
            safety, or the safety of others.
          </Text>
        </Section>

        <Section number="4" title="Data Storage & Security">
          <Text style={styles.bodyText}>
            Your data is stored securely on Supabase cloud infrastructure with the following
            protections:
          </Text>
          <Bullet>End-to-end encryption for data in transit (TLS/SSL)</Bullet>
          <Bullet>Encrypted storage at rest for sensitive data</Bullet>
          <Bullet>Row-level security (RLS) policies to prevent unauthorized access</Bullet>
          <Bullet>OTP-based authentication (no passwords stored)</Bullet>
          <Bullet>Secure session token management via expo-secure-store</Bullet>
          <Text style={[styles.bodyText, { marginTop: Spacing.md }]}>
            While we implement industry-standard security measures, no method of electronic
            storage or transmission is 100% secure. We cannot guarantee absolute security.
          </Text>
        </Section>

        <Section number="5" title="Data Retention">
          <Text style={styles.bodyText}>We retain your personal data as follows:</Text>
          <Bullet>Active account data: retained as long as your account is active</Bullet>
          <Bullet>Transaction records: retained for 5 years for legal/tax compliance</Bullet>
          <Bullet>Deleted account data: permanently removed within 30 days of deletion</Bullet>
          <Bullet>Usage analytics: retained in anonymized form indefinitely</Bullet>
        </Section>

        <Section number="6" title="Your Rights">
          <Text style={styles.bodyText}>
            Under applicable Indian data protection laws, you have the right to:
          </Text>
          <Bullet>Access your personal data stored with us</Bullet>
          <Bullet>Correct inaccurate or incomplete personal information</Bullet>
          <Bullet>Delete your account and associated data</Bullet>
          <Bullet>Withdraw consent for location tracking at any time</Bullet>
          <Bullet>Request a copy of your data in a portable format</Bullet>
          <Text style={[styles.bodyText, { marginTop: Spacing.md }]}>
            You can exercise most of these rights directly through the app's Profile settings.
            For additional requests, contact us at the email provided below.
          </Text>
        </Section>

        <Section number="7" title="Location Permissions">
          <Text style={styles.bodyText}>
            PaniApp requests location permission to provide location-based services. You can
            control location access through:
          </Text>
          <Bullet>Your device's system settings</Bullet>
          <Bullet>The online/offline toggle in the app (workers)</Bullet>
          <Text style={[styles.bodyText, { marginTop: Spacing.md }]}>
            Disabling location access may limit certain features like finding nearby jobs or
            being discovered by recruiters.
          </Text>
        </Section>

        <Section number="8" title="Camera Permissions">
          <Text style={styles.bodyText}>
            PaniApp may request camera access for uploading payment screenshots or profile
            photos. Camera data is used solely for the stated purpose and is not accessed
            without your explicit action.
          </Text>
        </Section>

        <Section number="9" title="Children's Privacy">
          <Text style={styles.bodyText}>
            PaniApp is not intended for use by anyone under 18 years of age. We do not
            knowingly collect personal information from children. If we learn that we have
            collected data from a child under 18, we will take steps to delete that
            information promptly.
          </Text>
        </Section>

        <Section number="10" title="Third-Party Links">
          <Text style={styles.bodyText}>
            The App may contain links to third-party services (such as UPI payment apps).
            We are not responsible for the privacy practices of these external services.
            We encourage you to review their privacy policies.
          </Text>
        </Section>

        <Section number="11" title="Changes to This Policy">
          <Text style={styles.bodyText}>
            We may update this Privacy Policy from time to time to reflect changes in our
            practices or for legal, operational, or regulatory reasons. We will notify you
            of significant changes through in-app notifications. The "Effective Date" at the
            top of this policy indicates when it was last revised.
          </Text>
        </Section>

        <Section number="12" title="Compliance">
          <Text style={styles.bodyText}>
            This Privacy Policy is designed to comply with applicable Indian data protection
            regulations, including the Digital Personal Data Protection Act (DPDP Act), 2023.
            We are committed to upholding the principles of data minimization, purpose
            limitation, and user consent.
          </Text>
        </Section>

        {/* Contact */}
        <View style={styles.contactCard}>
          <Text style={styles.contactIcon}>📧</Text>
          <Text style={styles.contactTitle}>Contact Us</Text>
          <Text style={styles.contactText}>
            If you have questions or concerns about this Privacy Policy or your personal data,
            please reach out:
          </Text>
          <Text style={styles.contactEmail}>support.paniapp@gmail.com</Text>
          <Text style={[styles.contactEmail, { marginTop: Spacing.xs }]}>+91 6304115548</Text>

        </View>

        <View style={{ height: Spacing['4xl'] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },

  // ─── Header ──────────────────────────────────────────────────────────
  header: {
    backgroundColor: Colors.primary[800],
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 32,
    paddingHorizontal: Spacing['2xl'],
    borderBottomLeftRadius: BorderRadius['3xl'],
    borderBottomRightRadius: BorderRadius['3xl'],
    overflow: 'hidden',
    position: 'relative',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    zIndex: 2,
  },
  backIcon: {
    fontSize: 22,
    color: Colors.neutral[0],
    fontWeight: '700',
  },
  headerContent: {
    zIndex: 2,
  },
  headerIcon: {
    fontSize: 36,
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.size['2xl'],
    fontWeight: '900',
    color: Colors.neutral[0],
    letterSpacing: Typography.letterSpacing.tight,
  },
  headerSubtitle: {
    fontSize: Typography.size.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: Spacing.xs,
    lineHeight: Typography.lineHeight.sm,
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  circle1: {
    width: 180,
    height: 180,
    top: -30,
    right: -50,
  },
  circle2: {
    width: 100,
    height: 100,
    bottom: -20,
    right: 60,
  },

  // ─── Content ─────────────────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.xl,
  },

  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  dateBadgeIcon: {
    fontSize: 14,
  },
  dateBadgeText: {
    fontSize: Typography.size.xs,
    fontWeight: '600',
    color: Colors.primary[800],
  },

  intro: {
    fontSize: Typography.size.base,
    color: Colors.light.textSecondary,
    lineHeight: Typography.lineHeight.base + 4,
    marginBottom: Spacing['2xl'],
  },

  // ─── Sections ────────────────────────────────────────────────────────
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionNumberText: {
    fontSize: Typography.size.sm,
    fontWeight: '700',
    color: Colors.primary[800],
  },
  sectionTitle: {
    fontSize: Typography.size.md,
    fontWeight: '700',
    color: Colors.light.textPrimary,
    flex: 1,
  },
  sectionBody: {
    paddingLeft: 44,
  },

  subHeading: {
    fontSize: Typography.size.sm,
    fontWeight: '700',
    color: Colors.light.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },

  bodyText: {
    fontSize: Typography.size.sm,
    color: Colors.light.textSecondary,
    lineHeight: Typography.lineHeight.base,
    marginBottom: Spacing.sm,
  },

  bulletRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
    paddingRight: Spacing.md,
  },
  bulletDot: {
    fontSize: Typography.size.sm,
    color: Colors.primary[600],
    marginRight: Spacing.sm,
    lineHeight: Typography.lineHeight.base,
    fontWeight: '700',
  },
  bulletText: {
    fontSize: Typography.size.sm,
    color: Colors.light.textSecondary,
    lineHeight: Typography.lineHeight.base,
    flex: 1,
  },

  // ─── Contact Card ────────────────────────────────────────────────────
  contactCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius.xl,
    padding: Spacing['2xl'],
    alignItems: 'center',
    marginTop: Spacing.lg,
    ...Shadows.md,
  },
  contactIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  contactTitle: {
    fontSize: Typography.size.lg,
    fontWeight: '700',
    color: Colors.light.textPrimary,
    marginBottom: Spacing.xs,
  },
  contactText: {
    fontSize: Typography.size.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.sm,
    marginBottom: Spacing.md,
  },
  contactEmail: {
    fontSize: Typography.size.base,
    fontWeight: '700',
    color: Colors.primary[800],
  },
});
