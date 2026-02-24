import React from 'react';
import { FileText } from 'lucide-react';

export default function License() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 md:p-12">
        <div className="flex items-center gap-3 mb-8">
          <FileText className="w-8 h-8 text-indigo-600" />
          <h1 className="text-4xl font-bold text-slate-900">License</h1>
        </div>

        <div className="prose prose-slate max-w-none">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">MIT License</h2>

          <p className="text-slate-600 mb-6">
            Copyright (c) 2024 Etherene Protocol
          </p>

          <p className="text-slate-600 mb-6">
            Permission is hereby granted, free of charge, to any person obtaining a copy
            of this software and associated documentation files (the "Software"), to deal
            in the Software without restriction, including without limitation the rights
            to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
            copies of the Software, and to permit persons to whom the Software is
            furnished to do so, subject to the following conditions:
          </p>

          <p className="text-slate-600 mb-6">
            The above copyright notice and this permission notice shall be included in all
            copies or substantial portions of the Software.
          </p>

          <p className="text-slate-600 mb-6">
            THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
            IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
            FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
            AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
            LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
            OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
            SOFTWARE.
          </p>

          <h3 className="text-lg font-bold text-slate-900 mt-8 mb-4">Third-Party Licenses</h3>
          <p className="text-slate-600 mb-6">
            This project uses open-source libraries and frameworks. Please refer to the
            respective project repositories for their license information, including but not
            limited to:
          </p>

          <ul className="list-disc list-inside text-slate-600 space-y-2 mb-6">
            <li>React - MIT License</li>
            <li>Solana Web3.js - MIT License</li>
            <li>Tailwind CSS - MIT License</li>
            <li>Framer Motion - MIT License</li>
          </ul>

          <p className="text-slate-500 text-sm mt-8 pt-8 border-t border-slate-200">
            Last updated: February 2024
          </p>
        </div>
      </div>
    </div>
  );
}