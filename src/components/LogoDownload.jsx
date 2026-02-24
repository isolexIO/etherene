import React from 'react';
import { Download } from 'lucide-react';
import Logo from './Logo';

export default function LogoDownload() {
  const downloadLogo = (format = 'svg') => {
    const svg = document.querySelector('[data-logo-svg]').outerHTML;
    
    if (format === 'svg') {
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'etherene-logo.svg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'png') {
      const canvas = document.createElement('canvas');
      const size = 256;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, size, size);
      
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, size, size);
        canvas.toBlob(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'etherene-logo.png';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(svg);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => downloadLogo('svg')}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
      >
        <Download className="w-4 h-4" />
        Download SVG
      </button>
      <button
        onClick={() => downloadLogo('png')}
        className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
      >
        <Download className="w-4 h-4" />
        Download PNG
      </button>
      <div data-logo-svg className="hidden">
        <Logo className="w-64 h-64" />
      </div>
    </div>
  );
}