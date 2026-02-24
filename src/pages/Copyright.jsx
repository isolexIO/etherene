import React from 'react';
import { Copyright } from 'lucide-react';

export default function CopyrightPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 md:p-12">
        <div className="flex items-center gap-3 mb-8">
          <Copyright className="w-8 h-8 text-indigo-600" />
          <h1 className="text-4xl font-bold text-slate-900">Copyright Notice</h1>
        </div>

        <div className="prose prose-slate max-w-none">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">© 2024 Etherene Protocol</h2>

          <h3 className="text-lg font-bold text-slate-900 mt-8 mb-4">Ownership and Rights</h3>
          <p className="text-slate-600 mb-6">
            All content, including text, graphics, logos, images, audio clips, digital downloads,
            data compilations, and software, is the property of Etherene Protocol or its content
            suppliers and is protected by international copyright laws.
          </p>

          <h3 className="text-lg font-bold text-slate-900 mt-8 mb-4">Permitted Use</h3>
          <p className="text-slate-600 mb-6">
            You are permitted to use this website and its content for lawful purposes only. You may
            not:
          </p>

          <ul className="list-disc list-inside text-slate-600 space-y-2 mb-6">
            <li>Reproduce, distribute, or transmit any content without prior written permission</li>
            <li>Modify, adapt, or create derivative works from any content</li>
            <li>Remove or alter any proprietary notices or labels</li>
            <li>Use automated tools to download or extract content</li>
            <li>Resell, rent, lease, or lend content to third parties</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-900 mt-8 mb-4">Attribution</h3>
          <p className="text-slate-600 mb-6">
            When referencing or sharing content from the Etherene Protocol, appropriate attribution
            must be provided to the original source.
          </p>

          <h3 className="text-lg font-bold text-slate-900 mt-8 mb-4">Digital Millennium Copyright Act (DMCA)</h3>
          <p className="text-slate-600 mb-6">
            If you believe your copyrighted work has been infringed, please contact us with:
          </p>

          <ul className="list-disc list-inside text-slate-600 space-y-2 mb-6">
            <li>Your name, address, and contact information</li>
            <li>Description of the copyrighted work</li>
            <li>Location of the infringing material on our site</li>
            <li>Statement that you believe in good faith that the use is unauthorized</li>
            <li>Your signature or electronic signature</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-900 mt-8 mb-4">Disclaimer</h3>
          <p className="text-slate-600 mb-6">
            While we strive to ensure all content is original or properly licensed, errors may occur.
            We will promptly address any copyright concerns brought to our attention.
          </p>

          <p className="text-slate-500 text-sm mt-8 pt-8 border-t border-slate-200">
            Last updated: February 2024
          </p>
        </div>
      </div>
    </div>
  );
}