// Analytics utility functions for tracking visitors and interactions

// Track a visitor (page view)
export const trackVisitor = () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const visitors = JSON.parse(localStorage.getItem('visitors') || '[]');
    
    // Check if we already tracked this visitor today (simple approach - one per day)
    const lastVisitor = visitors[visitors.length - 1];
    if (lastVisitor && lastVisitor.date === today) {
      // Update count for today
      lastVisitor.count = (lastVisitor.count || 1) + 1;
    } else {
      // New day, add new entry
      visitors.push({
        date: today,
        count: 1,
        timestamp: new Date().toISOString()
      });
    }
    
    // Keep only last 90 days
    if (visitors.length > 90) {
      visitors.splice(0, visitors.length - 90);
    }
    
    localStorage.setItem('visitors', JSON.stringify(visitors));
  } catch (err) {
    console.error('Error tracking visitor:', err);
  }
};

// Track a product click
export const trackProductClick = (productId, productName) => {
  try {
    const clicks = JSON.parse(localStorage.getItem('productClicks') || '[]');
    clicks.push({
      productId,
      productName,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0]
    });
    
    // Keep only last 1000 entries
    if (clicks.length > 1000) {
      clicks.splice(0, clicks.length - 1000);
    }
    
    localStorage.setItem('productClicks', JSON.stringify(clicks));
  } catch (err) {
    console.error('Error tracking product click:', err);
  }
};

// Get visitor statistics
export const getVisitorStats = () => {
  try {
    const visitors = JSON.parse(localStorage.getItem('visitors') || '[]');
    const total = visitors.reduce((sum, v) => sum + (v.count || 1), 0);
    return {
      daily: visitors,
      total,
      today: visitors[visitors.length - 1]?.count || 0
    };
  } catch (err) {
    console.error('Error getting visitor stats:', err);
    return { daily: [], total: 0, today: 0 };
  }
};

// Get product click statistics
export const getProductClickStats = () => {
  try {
    const clicks = JSON.parse(localStorage.getItem('productClicks') || '[]');
    
    // Group by product
    const byProduct = {};
    clicks.forEach(click => {
      const key = click.productId || click.productName;
      if (!byProduct[key]) {
        byProduct[key] = {
          productId: click.productId,
          productName: click.productName,
          clicks: 0,
          dates: {}
        };
      }
      byProduct[key].clicks++;
      const date = click.date || click.timestamp.split('T')[0];
      byProduct[key].dates[date] = (byProduct[key].dates[date] || 0) + 1;
    });
    
    // Convert to array and sort by clicks
    const productStats = Object.values(byProduct).sort((a, b) => b.clicks - a.clicks);
    
    return {
      byProduct: productStats,
      total: clicks.length
    };
  } catch (err) {
    console.error('Error getting product click stats:', err);
    return { byProduct: [], total: 0 };
  }
};
