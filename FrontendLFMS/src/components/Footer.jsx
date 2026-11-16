import React from 'react';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto py-6">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Lost and Found Management System (LFMS).</p>
        <p className="mt-1 text-xs text-gray-400">
          React &bull; Spring Boot &bull; Supabase PostgreSQL &bull; Cloudflare Pages &bull; Light Cloud
        </p>
      </div>
    </footer>
  );
};
