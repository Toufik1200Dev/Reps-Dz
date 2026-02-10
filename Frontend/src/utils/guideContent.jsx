import React from 'react';

function renderParagraph(para, i) {
  const parts = [];
  let rest = para.trim();
  let key = 0;
  while (rest.length > 0) {
    const boldStart = rest.indexOf('**');
    if (boldStart === -1) {
      parts.push(<span key={key++}>{rest}</span>);
      break;
    }
    if (boldStart > 0) {
      parts.push(<span key={key++}>{rest.slice(0, boldStart)}</span>);
    }
    rest = rest.slice(boldStart + 2);
    const boldEnd = rest.indexOf('**');
    if (boldEnd === -1) {
      parts.push(<strong key={key++}>{rest}</strong>);
      break;
    }
    parts.push(<strong key={key++}>{rest.slice(0, boldEnd)}</strong>);
    rest = rest.slice(boldEnd + 2);
  }
  return (
    <p key={i} className="mb-4 md:mb-5 text-gray-700 leading-relaxed text-base md:text-lg">
      {parts}
    </p>
  );
}

/**
 * Renders guide content string (paragraphs + **bold**) as React nodes.
 */
export function renderGuideContent(content) {
  if (!content || typeof content !== 'string') return null;
  const trimmed = content.trim();
  const paragraphs = trimmed.split(/\n\n+/).filter(Boolean);
  return paragraphs.map((para, i) => renderParagraph(para, i));
}

/**
 * Renders guide content with an ad injected after the first N paragraphs (e.g. In-Article ad after 2 paragraphs).
 * Returns an array of React nodes: [p1, p2, ad, p3, p4, ...]. Ad is not inserted if there are fewer than adAfterParagraphs.
 */
export function renderGuideContentWithAd(content, adAfterParagraphs, adNode) {
  if (!content || typeof content !== 'string') return null;
  const trimmed = content.trim();
  const paragraphs = trimmed.split(/\n\n+/).filter(Boolean);
  const result = [];
  paragraphs.forEach((para, i) => {
    result.push(renderParagraph(para, i));
    if (i === adAfterParagraphs - 1 && adNode) {
      result.push(React.cloneElement(adNode, { key: 'in-article-ad' }));
    }
  });
  return result;
}

/**
 * Renders guide content with desktop ad after first N paragraphs and mobile-only ads between every N paragraphs.
 * Mobile ads are shown only on phones (md:hidden).
 */
export function renderGuideContentWithDesktopAndMobileAds(content, adAfterParagraphs, desktopAdNode, mobileAdNode, mobileAdEvery = 2) {
  if (!content || typeof content !== 'string') return null;
  const trimmed = content.trim();
  const paragraphs = trimmed.split(/\n\n+/).filter(Boolean);
  const result = [];
  paragraphs.forEach((para, i) => {
    result.push(renderParagraph(para, i));
    // Desktop ad: after first N paragraphs (hidden on mobile, sidebars handle desktop)
    if (i === adAfterParagraphs - 1 && desktopAdNode) {
      result.push(
        React.cloneElement(desktopAdNode, {
          key: `desktop-ad-${i}`,
          className: `${desktopAdNode.props.className || ''} hidden md:flex`.trim(),
        })
      );
    }
    // Mobile ads: between paragraphs, every mobileAdEvery paragraphs (2, 4, 6...)
    if (mobileAdNode && (i + 1) % mobileAdEvery === 0 && i >= adAfterParagraphs - 1) {
      result.push(
        React.createElement(
          'div',
          { key: `mobile-ad-${i}`, className: 'flex justify-center py-4 md:hidden' },
          React.cloneElement(mobileAdNode, { key: `mobile-ad-node-${i}` })
        )
      );
    }
  });
  return result;
}
