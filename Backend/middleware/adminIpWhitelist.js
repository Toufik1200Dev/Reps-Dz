/**
 * Admin IP Whitelist Middleware
 * Restricts /api/admin access to whitelisted IPs only.
 * When whitelist is empty, all IPs are allowed (so admin can initially configure it).
 */
const path = require('path');
const fs = require('fs');

const WHITELIST_PATH = path.join(__dirname, '../data/admin-ip-whitelist.json');

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0];
    return (first || '').trim();
  }
  return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '';
}

function getWhitelist() {
  try {
    if (fs.existsSync(WHITELIST_PATH)) {
      const data = fs.readFileSync(WHITELIST_PATH, 'utf8');
      const parsed = JSON.parse(data);
      return Array.isArray(parsed.ips) ? parsed.ips : [];
    }
  } catch (err) {
    console.error('Admin IP whitelist read error:', err.message);
  }
  return [];
}

const adminIpWhitelist = (req, res, next) => {
  const ips = getWhitelist();
  if (ips.length === 0) {
    return next();
  }
  const clientIp = getClientIp(req);
  const normalizedClient = clientIp.replace(/^::ffff:/, '');
  const allowed = ips.some((ip) => {
    const n = String(ip).trim().replace(/^::ffff:/, '');
    return n === clientIp || n === normalizedClient;
  });
  if (!allowed) {
    console.warn(`Admin access denied for IP: ${clientIp}`);
    return res.status(403).json({
      success: false,
      message: 'Access denied. Your IP is not whitelisted for admin access.'
    });
  }
  next();
};

function getClientIpFromRequest(req) {
  return getClientIp(req);
}

function saveWhitelist(ips) {
  const dir = path.dirname(WHITELIST_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const data = { ips: Array.isArray(ips) ? ips.map((ip) => String(ip).trim()).filter(Boolean) : [] };
  fs.writeFileSync(WHITELIST_PATH, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = adminIpWhitelist;
module.exports.getWhitelist = getWhitelist;
module.exports.saveWhitelist = saveWhitelist;
module.exports.getClientIp = getClientIpFromRequest;
module.exports.WHITELIST_PATH = WHITELIST_PATH;
