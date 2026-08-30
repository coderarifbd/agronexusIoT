const requestMap = new Map();

export function rateLimiter(limit = 60, windowMs = 60000) {
  return (req, res, next) => {
    const key = req.ip || "unknown-ip";
    const now = Date.now();

    const record = requestMap.get(key) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count += 1;
    }

    requestMap.set(key, record);

    if (record.count > limit) {
      return res.status(429).json({
        error: "Too many requests. Please slow down and try again shortly."
      });
    }

    next();
  };
}
