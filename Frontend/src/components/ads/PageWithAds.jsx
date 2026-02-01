import React from 'react';
import AdSense, { getAdSlot } from './AdSense';

/**
 * Wraps page content with top ad and optional left/right sidebar ads (desktop).
 */
export default function PageWithAds({ children }) {
  return (
    <div className="w-full">
      {/* Top ad below header */}
      <div className="bg-gray-50 border-b border-gray-100 py-3 flex justify-center">
        <AdSense slot={getAdSlot('pageTop')} format="auto" className="w-full max-w-[970px] mx-auto min-h-[90px]" />
      </div>

      <div className="max-w-[2000px] mx-auto px-2 sm:px-4 lg:px-6 flex gap-4 lg:gap-6">
        {/* Left sidebar ad - desktop only */}
        <aside className="hidden xl:block w-[160px] 2xl:w-[200px] flex-shrink-0 sticky top-24 h-fit order-first">
          <AdSense slot={getAdSlot('sidebar')} format="rectangle" className="min-h-[250px]" />
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>

        {/* Right sidebar ad - desktop only */}
        <aside className="hidden xl:block w-[160px] 2xl:w-[200px] flex-shrink-0 sticky top-24 h-fit">
          <AdSense slot={getAdSlot('sidebar')} format="rectangle" className="min-h-[250px]" />
        </aside>
      </div>
    </div>
  );
}
