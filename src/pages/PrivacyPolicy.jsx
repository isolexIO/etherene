import React from 'react';
import { Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 md:p-12">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-indigo-600" />
          <h1 className="text-4xl font-bold text-slate-900">Privacy Policy</h1>
        </div>

        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 mb-6">
            <strong>Effective Date:</strong> February 2024
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-6">1. Introduction</h2>
          <p className="text-slate-600 mb-6">
            Etherene Protocol ("we," "us," "our," or "Company") is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information
            when you use our website and services.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-6">2. Information We Collect</h2>
          <h3 className="text-lg font-bold text-slate-900 mt-6 mb-4">Wallet Information</h3>
          <p className="text-slate-600 mb-6">
            When you connect your wallet to our service, we collect and store your public wallet address.
            This information is necessary to provide protocol services and is not sensitive.
          </p>

          <h3 className="text-lg font-bold text-slate-900 mt-6 mb-4">Profile Information</h3>
          <p className="text-slate-600 mb-6">
            You may optionally provide profile information including display name, bio, avatar image,
            and social media links. This information is publicly visible on your profile.
          </p>

          <h3 className="text-lg font-bold text-slate-900 mt-6 mb-4">Activity Data</h3>
          <p className="text-slate-600 mb-6">
            We collect information about your interactions on the protocol, including:
          </p>
          <ul className="list-disc list-inside text-slate-600 space-y-2 mb-6">
            <li>Transmissions and resonances (posts and comments)</li>
            <li>Oracle interactions and queries</li>
            <li>Follow relationships</li>
            <li>Last seen timestamps for online status</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-900 mt-6 mb-4">Technical Information</h3>
          <p className="text-slate-600 mb-6">
            We automatically collect technical information including IP addresses, browser type,
            operating system, and usage patterns to improve our services.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-6">3. How We Use Your Information</h2>
          <ul className="list-disc list-inside text-slate-600 space-y-2 mb-6">
            <li>Provide and maintain protocol services</li>
            <li>Process transactions and payments</li>
            <li>Display your profile and content to other users</li>
            <li>Improve service quality and user experience</li>
            <li>Detect and prevent fraud or security issues</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mb-6">4. Data Security</h2>
          <p className="text-slate-600 mb-6">
            We implement industry-standard security measures to protect your information. However,
            no method of transmission over the Internet is 100% secure. We cannot guarantee absolute
            security of your data.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-6">5. Blockchain Transparency</h2>
          <p className="text-slate-600 mb-6">
            Information stored on the Solana blockchain is publicly visible and immutable. By using
            our protocol, you acknowledge that certain data may be permanently recorded on the blockchain.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-6">6. Third-Party Links</h2>
          <p className="text-slate-600 mb-6">
            Our website may contain links to third-party websites. We are not responsible for the privacy
            practices of external sites. Please review their privacy policies before sharing information.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-6">7. Your Rights</h2>
          <p className="text-slate-600 mb-6">
            Depending on your jurisdiction, you may have the right to:
          </p>
          <ul className="list-disc list-inside text-slate-600 space-y-2 mb-6">
            <li>Access your personal data</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data (subject to blockchain limitations)</li>
            <li>Opt-out of certain data collection</li>
            <li>Data portability</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mb-6">8. Cookies and Tracking</h2>
          <p className="text-slate-600 mb-6">
            We use cookies and similar tracking technologies to enhance your experience. You can control
            cookie preferences through your browser settings.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-6">9. Children's Privacy</h2>
          <p className="text-slate-600 mb-6">
            Our services are not intended for children under 13. We do not knowingly collect data from
            children under 13. If we become aware of such collection, we will take appropriate action.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-6">10. Contact Us</h2>
          <p className="text-slate-600 mb-6">
            If you have questions about this Privacy Policy or our privacy practices, please contact us
            through our website or support channels.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-6">11. Policy Updates</h2>
          <p className="text-slate-600 mb-6">
            We may update this Privacy Policy periodically. Changes will be posted on this page with
            an updated effective date. Your continued use of the service constitutes acceptance of the
            updated policy.
          </p>

          <p className="text-slate-500 text-sm mt-8 pt-8 border-t border-slate-200">
            Last updated: February 2024
          </p>
        </div>
      </div>
    </div>
  );
}