// Analytics utility functions for tracking visitors and interactions

const PAGE_VIEWS_KEY = 'pageViews';
const PAGE_VIEWS_MAX = 3000;
const PROGRAM_EVENTS_KEY = 'programEvents';
const PROGRAM_EVENTS_MAX = 2000;

/** Track a page view (call on each page/route) */
export const trackPageView = (path, pageName) => {
  try {
    const views = JSON.parse(localStorage.getItem(PAGE_VIEWS_KEY) || '[]');
    views.push({
      path: path || '/',
      pageName: pageName || path || 'Unknown',
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
    });
    if (views.length > PAGE_VIEWS_MAX) {
      views.splice(0, views.length - PAGE_VIEWS_MAX);
    }
    localStorage.setItem(PAGE_VIEWS_KEY, JSON.stringify(views));
  } catch (err) {
    console.error('Error tracking page view:', err);
  }
};

/** Get page view stats: by page, total, today */
export const getPageViewStats = () => {
  try {
    const views = JSON.parse(localStorage.getItem(PAGE_VIEWS_KEY) || '[]');
    const byPage = {};
    const today = new Date().toISOString().split('T')[0];
    let todayCount = 0;
    views.forEach((v) => {
      const key = v.path || v.pageName || 'unknown';
      if (!byPage[key]) {
        byPage[key] = { path: v.path, pageName: v.pageName, views: 0, dates: {} };
      }
      byPage[key].views++;
      const d = v.date || (v.timestamp && v.timestamp.split('T')[0]);
      if (d) byPage[key].dates[d] = (byPage[key].dates[d] || 0) + 1;
      if (d === today) todayCount++;
    });
    const byPageList = Object.values(byPage).sort((a, b) => b.views - a.views);
    return { byPage: byPageList, total: views.length, today: todayCount };
  } catch (err) {
    console.error('Error getting page view stats:', err);
    return { byPage: [], total: 0, today: 0 };
  }
};

/** Track program plan selection (free/paid) */
export const trackProgramPlanSelect = (plan) => {
  try {
    const events = JSON.parse(localStorage.getItem(PROGRAM_EVENTS_KEY) || '[]');
    events.push({ type: 'plan_select', plan, timestamp: new Date().toISOString(), date: new Date().toISOString().split('T')[0] });
    if (events.length > PROGRAM_EVENTS_MAX) events.splice(0, events.length - PROGRAM_EVENTS_MAX);
    localStorage.setItem(PROGRAM_EVENTS_KEY, JSON.stringify(events));
  } catch (err) {
    console.error('Error tracking program plan select:', err);
  }
};

/** Track program generation (free 1-week or paid 6-week) */
export const trackProgramGenerate = (plan, success = true) => {
  try {
    const events = JSON.parse(localStorage.getItem(PROGRAM_EVENTS_KEY) || '[]');
    events.push({ type: 'generate', plan, success, timestamp: new Date().toISOString(), date: new Date().toISOString().split('T')[0] });
    if (events.length > PROGRAM_EVENTS_MAX) events.splice(0, events.length - PROGRAM_EVENTS_MAX);
    localStorage.setItem(PROGRAM_EVENTS_KEY, JSON.stringify(events));
  } catch (err) {
    console.error('Error tracking program generate:', err);
  }
};

/** Get program event stats (plan selects, generates by plan) */
export const getProgramEventStats = () => {
  try {
    const events = JSON.parse(localStorage.getItem(PROGRAM_EVENTS_KEY) || '[]');
    const planSelects = { free: 0, paid: 0 };
    const generates = { free: 0, paid: 0 };
    events.forEach((e) => {
      if (e.type === 'plan_select') {
        if (e.plan === 'paid') planSelects.paid++;
        else planSelects.free++;
      }
      if (e.type === 'generate' && e.success) {
        if (e.plan === 'paid') generates.paid++;
        else generates.free++;
      }
    });
    return { planSelects, generates, totalEvents: events.length };
  } catch (err) {
    return { planSelects: { free: 0, paid: 0 }, generates: { free: 0, paid: 0 }, totalEvents: 0 };
  }
};

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

// ——— Blog / Guide (articles) ———

const BLOG_VIEWS_KEY = 'blogViews';
const BLOG_VIEWS_MAX = 2000;

/** Track a blog/guide view (when user opens a guide article). */
export const trackBlogView = (slug, title) => {
  try {
    const views = JSON.parse(localStorage.getItem(BLOG_VIEWS_KEY) || '[]');
    views.push({
      slug: slug || '',
      title: title || 'Untitled',
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
    });
    if (views.length > BLOG_VIEWS_MAX) {
      views.splice(0, views.length - BLOG_VIEWS_MAX);
    }
    localStorage.setItem(BLOG_VIEWS_KEY, JSON.stringify(views));
  } catch (err) {
    console.error('Error tracking blog view:', err);
  }
};

/** Get blog/guide stats: total clicks (views) and reach (unique guides with at least one view). */
export const getBlogClickStats = () => {
  try {
    const views = JSON.parse(localStorage.getItem(BLOG_VIEWS_KEY) || '[]');
    const byGuide = {};
    views.forEach((v) => {
      const key = v.slug || v.title || 'unknown';
      if (!byGuide[key]) {
        byGuide[key] = {
          slug: v.slug,
          title: v.title,
          clicks: 0,
          dates: {},
        };
      }
      byGuide[key].clicks++;
      const date = v.date || (v.timestamp && v.timestamp.split('T')[0]);
      if (date) byGuide[key].dates[date] = (byGuide[key].dates[date] || 0) + 1;
    });
    const byGuideList = Object.values(byGuide).sort((a, b) => b.clicks - a.clicks);
    const totalClicks = views.length;
    const reach = byGuideList.length; // unique guides that received at least one view
    return {
      byGuide: byGuideList,
      totalClicks,
      reach,
    };
  } catch (err) {
    console.error('Error getting blog click stats:', err);
    return { byGuide: [], totalClicks: 0, reach: 0 };
  }
};
