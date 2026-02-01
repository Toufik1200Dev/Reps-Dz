// Lightweight inline SVG placeholders to avoid external network calls and missing public assets.
// Use these anywhere we previously used `/placeholder.jpg` or `/placeholder-product.png`.

export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;base64,' +
  btoa(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
      <rect width="100%" height="100%" fill="#e5e7eb"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="28" fill="#9ca3af">
        No Image
      </text>
    </svg>`
  );

export const PLACEHOLDER_PRODUCT =
  'data:image/svg+xml;base64,' +
  btoa(
    `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="20" fill="#9ca3af">
        Product
      </text>
    </svg>`
  );

