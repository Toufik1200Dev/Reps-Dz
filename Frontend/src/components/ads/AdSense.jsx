import React, { useEffect, useRef } from 'react';
import { AD_CLIENT, getAdSlot } from '../../config/adsense';

/**
 * Responsive AdSense ad unit.
 * Best practice: wrapper has padding so ad is not flush with buttons/links (reduces accidental clicks).
 * Use one component per placement; each needs its own slot ID from adsense config.
 */
export { getAdSlot };

export default function AdSense({
  slot,
  slotName,
  format = 'auto',
  className = '',
  style = {},
  /** Extra padding around ad (default 16px) to avoid accidental clicks */
  padded = true,
}) {
  const insRef = useRef(null);
  const slotId = slot || (slotName && getAdSlot(slotName));

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && insRef.current && !insRef.current.dataset.adsbygoogleStatus) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        insRef.current.dataset.adsbygoogleStatus = 'pushed';
      }
    } catch (e) {
      console.warn('AdSense push:', e);
    }
  }, [slotId]);

  const isRectangle = format === 'rectangle' || format === 'vertical';
  const insStyle = isRectangle
    ? { display: 'block', minWidth: '200px', minHeight: '200px' }
    : { display: 'block' };

  return (
    <div
      className={`adsense-wrapper ${padded ? 'm-2' : ''} ${className}`}
      style={{
        overflow: 'hidden',
        ...style,
      }}
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={insStyle}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slotId}
        data-ad-format={format === 'auto' ? 'auto' : undefined}
        data-full-width-responsive={format === 'auto' ? 'true' : undefined}
      />
    </div>
  );
}
