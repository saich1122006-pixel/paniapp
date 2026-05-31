// ============================================================================
// Terms of Service Screen
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

export default function TermsOfServiceScreen() {
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
          <Text style={styles.headerIcon}>📜</Text>
          <Text style={styles.headerTitle}>Terms of Service</Text>
          <Text style={styles.headerSubtitle}>
            Please read these terms carefully before using PaniApp
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
          Welcome to PaniApp! These Terms of Service ("Terms") govern your use of the PaniApp
          mobile application ("App") operated by PaniApp Technologies ("we", "us", or "our").
          By accessing or using the App, you agree to be bound by these Terms.
        </Text>

        <Section number="1" title="Acceptance of Terms">
          <Text style={styles.bodyText}>
            By creating an account, accessing, or using PaniApp, you confirm that you have read,
            understood, and agree to these Terms of Service and our Privacy Policy. If you do not
            agree to these Terms, you must not use the App.
          </Text>
        </Section>

        <Section number="2" title="Eligibility">
          <Text style={styles.bodyText}>To use PaniApp, you must:</Text>
          <Bullet>Be at least 18 years of age</Bullet>
          <Bullet>Have a valid Indian mobile phone number</Bullet>
          <Bullet>Be legally authorized to work or hire workers in India</Bullet>
          <Bullet>Provide accurate and truthful information during registration</Bullet>
        </Section>

        <Section number="3" title="Account Registration">
          <Text style={styles.bodyText}>
            You register using your phone number and OTP verification. You are responsible for
            maintaining the confidentiality of your account and for all activities that occur
            under your account. You agree to:
          </Text>
          <Bullet>Provide accurate profile information including your real name and skills</Bullet>
          <Bullet>Not share your account credentials with others</Bullet>
          <Bullet>Notify us immediately of any unauthorized access to your account</Bullet>
          <Bullet>Not create multiple accounts for deceptive purposes</Bullet>
        </Section>

        <Section number="4" title="Platform Services">
          <Text style={styles.bodyText}>
            PaniApp is a platform that connects workers seeking daily wage employment with
            recruiters looking to hire. We provide:
          </Text>
          <Bullet>Job posting and discovery based on location and skills</Bullet>
          <Bullet>Worker profile visibility and skill matching</Bullet>
          <Bullet>In-app communication between workers and recruiters</Bullet>
          <Bullet>Payment facilitation through UPI and other supported methods</Bullet>
          <Text style={[styles.bodyText, { marginTop: Spacing.md }]}>
            PaniApp acts solely as an intermediary platform. We are not an employer, employment
            agency, or party to any agreement between workers and recruiters.
          </Text>
        </Section>

        <Section number="5" title="Worker Responsibilities">
          <Text style={styles.bodyText}>As a worker on PaniApp, you agree to:</Text>
          <Bullet>Accurately represent your skills, experience, and availability</Bullet>
          <Bullet>Show up on time for accepted jobs</Bullet>
          <Bullet>Perform work in a professional and safe manner</Bullet>
          <Bullet>Communicate promptly with recruiters regarding job status</Bullet>
          <Bullet>Not cancel accepted jobs without reasonable notice</Bullet>
        </Section>

        <Section number="6" title="Recruiter Responsibilities">
          <Text style={styles.bodyText}>As a recruiter on PaniApp, you agree to:</Text>
          <Bullet>Post accurate job descriptions with fair wage information</Bullet>
          <Bullet>Provide a safe working environment for hired workers</Bullet>
          <Bullet>Pay workers the agreed-upon wage in a timely manner</Bullet>
          <Bullet>Comply with all applicable labor laws and regulations</Bullet>
          <Bullet>Not engage in discriminatory hiring practices</Bullet>
        </Section>

        <Section number="7" title="Payments & Transactions">
          <Text style={styles.bodyText}>
            Payments between workers and recruiters are facilitated through the App using UPI
            and other supported payment methods. You acknowledge that:
          </Text>
          <Bullet>PaniApp may charge a service fee on transactions</Bullet>
          <Bullet>We are not responsible for payment disputes between users</Bullet>
          <Bullet>All payments are subject to applicable tax regulations</Bullet>
          <Bullet>Refund policies are at the discretion of the parties involved</Bullet>
        </Section>

        <Section number="8" title="Prohibited Activities">
          <Text style={styles.bodyText}>You must not use PaniApp to:</Text>
          <Bullet>Post fraudulent or misleading job listings</Bullet>
          <Bullet>Harass, threaten, or abuse other users</Bullet>
          <Bullet>Engage in any illegal or unlawful activities</Bullet>
          <Bullet>Attempt to circumvent the platform's payment system</Bullet>
          <Bullet>Scrape, data mine, or reverse engineer any part of the App</Bullet>
          <Bullet>Impersonate another person or misrepresent your identity</Bullet>
        </Section>

        <Section number="9" title="Content & Intellectual Property">
          <Text style={styles.bodyText}>
            All content, trademarks, and intellectual property displayed on PaniApp are owned
            by or licensed to PaniApp Technologies. You retain ownership of the content you
            submit (profiles, job posts), but grant us a non-exclusive license to display and
            distribute it within the platform.
          </Text>
        </Section>

        <Section number="10" title="Limitation of Liability">
          <Text style={styles.bodyText}>
            To the maximum extent permitted by law, PaniApp shall not be liable for:
          </Text>
          <Bullet>The quality of work performed by workers</Bullet>
          <Bullet>Disputes between workers and recruiters</Bullet>
          <Bullet>Loss of earnings, data, or business opportunities</Bullet>
          <Bullet>Any indirect, incidental, or consequential damages</Bullet>
          <Bullet>Workplace injuries or accidents</Bullet>
          <Text style={[styles.bodyText, { marginTop: Spacing.md }]}>
            PaniApp is provided "as is" without warranties of any kind, either express or implied.
          </Text>
        </Section>

        <Section number="11" title="Termination">
          <Text style={styles.bodyText}>
            We reserve the right to suspend or terminate your account at any time if you violate
            these Terms, engage in fraudulent activity, or behave in a manner detrimental to the
            platform or other users. You may also delete your account at any time through the
            Profile settings.
          </Text>
        </Section>

        <Section number="12" title="Governing Law">
          <Text style={styles.bodyText}>
            These Terms shall be governed by and construed in accordance with the laws of India.
            Any disputes arising from these Terms shall be subject to the exclusive jurisdiction
            of the courts of Hyderabad, Telangana, India.
          </Text>
        </Section>

        <Section number="13" title="Changes to Terms">
          <Text style={styles.bodyText}>
            We may update these Terms from time to time. We will notify you of significant changes
            through in-app notifications. Your continued use of PaniApp after any changes
            constitutes acceptance of the revised Terms.
          </Text>
        </Section>

        {/* Contact */}
        <View style={styles.contactCard}>
          <Text style={styles.contactIcon}>💬</Text>
          <Text style={styles.contactTitle}>Questions?</Text>
          <Text style={styles.contactText}>
            If you have questions about these Terms of Service, please contact us at:
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
    backgroundColor: Colors.accent[700],
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
    backgroundColor: Colors.accent[50],
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
    color: Colors.accent[700],
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
    backgroundColor: Colors.accent[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionNumberText: {
    fontSize: Typography.size.sm,
    fontWeight: '700',
    color: Colors.accent[700],
  },
  sectionTitle: {
    fontSize: Typography.size.md,
    fontWeight: '700',
    color: Colors.light.textPrimary,
    flex: 1,
  },
  sectionBody: {
    paddingLeft: 44, // align with text after number badge
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
    color: Colors.accent[500],
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
    color: Colors.accent[700],
  },
});
