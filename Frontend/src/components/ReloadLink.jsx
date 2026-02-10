import React from 'react';

/**
 * Link component that triggers a full page reload on navigation.
 * Use this instead of React Router's Link when you want the page to reload on route change.
 */
export default function ReloadLink({ to, children, className, style, ...rest }) {
  return (
    <a href={to} className={className} style={style} {...rest}>
      {children}
    </a>
  );
}
