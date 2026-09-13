// Each check inspects the response headers of a scanned URL and returns
// a verdict. Severity controls both display order and score weighting.
// "critical" headers matter most for stopping common attack classes
// (XSS, clickjacking, protocol downgrade); "recommended" headers are
// good hygiene but rarely the sole line of defense.

const SEVERITY_WEIGHT = {
  critical: 3,
  important: 2,
  recommended: 1,
};

function checkCSP(headers) {
  const value = headers.get("content-security-policy");
  if (!value) {
    return {
      id: "csp",
      name: "Content-Security-Policy",
      severity: "critical",
      pass: false,
      verdict: "Missing. This is the strongest available defense against cross-site scripting — without it, an injected script tag runs with no restriction.",
      raw: null,
    };
  }
  const hasUnsafeInline = /script-src[^;]*'unsafe-inline'/.test(value);
  const hasWildcard = /script-src[^;]*\*/.test(value) && !/script-src[^;]*\*\.[a-z]/.test(value);
  if (hasUnsafeInline || hasWildcard) {
    return {
      id: "csp",
      name: "Content-Security-Policy",
      severity: "critical",
      pass: false,
      verdict: hasUnsafeInline
        ? "Present, but script-src allows 'unsafe-inline' — this cancels out most of the XSS protection the header is meant to provide."
        : "Present, but script-src allows a bare wildcard — any origin can serve scripts on this page.",
      raw: value,
    };
  }
  return {
    id: "csp",
    name: "Content-Security-Policy",
    severity: "critical",
    pass: true,
    verdict: "Present and scoped. Inline and wildcard script sources are restricted, which meaningfully limits what an injected script can do.",
    raw: value,
  };
}

function checkHSTS(headers, isHttps) {
  const value = headers.get("strict-transport-security");
  if (!isHttps) {
    return {
      id: "hsts",
      name: "Strict-Transport-Security",
      severity: "critical",
      pass: false,
      verdict: "Site was not served over HTTPS, so HSTS cannot apply. Visitors are exposed to downgrade and interception on every request.",
      raw: null,
    };
  }
  if (!value) {
    return {
      id: "hsts",
      name: "Strict-Transport-Security",
      severity: "critical",
      pass: false,
      verdict: "Missing. Without it, a visitor's first request (or one on a hostile network) can be silently downgraded to plain HTTP before it ever reaches HTTPS.",
      raw: null,
    };
  }
  const maxAgeMatch = value.match(/max-age=(\d+)/);
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;
  const sixMonths = 15552000;
  if (maxAge < sixMonths) {
    return {
      id: "hsts",
      name: "Strict-Transport-Security",
      severity: "critical",
      pass: false,
      verdict: `Present, but max-age is only ${maxAge} seconds (under 6 months). A short window means the protection lapses quickly if the browser doesn't revisit.`,
      raw: value,
    };
  }
  return {
    id: "hsts",
    name: "Strict-Transport-Security",
    severity: "critical",
    pass: true,
    verdict: "Present with a solid max-age. Browsers that have seen this once will refuse to connect over plain HTTP for the full window.",
    raw: value,
  };
}

function checkFrameOptions(headers) {
  const xfo = headers.get("x-frame-options");
  const cspValue = headers.get("content-security-policy") || "";
  const hasFrameAncestors = /frame-ancestors/.test(cspValue);
  if (hasFrameAncestors) {
    return {
      id: "frame",
      name: "Clickjacking protection",
      severity: "important",
      pass: true,
      verdict: "Handled via CSP's frame-ancestors directive, which is the modern replacement for X-Frame-Options and covers the same risk.",
      raw: cspValue.match(/frame-ancestors[^;]*/)?.[0] || null,
    };
  }
  if (!xfo) {
    return {
      id: "frame",
      name: "X-Frame-Options",
      severity: "important",
      pass: false,
      verdict: "Missing (and no frame-ancestors in CSP). This page can be embedded in an invisible iframe on another site and used for clickjacking.",
      raw: null,
    };
  }
  return {
    id: "frame",
    name: "X-Frame-Options",
    severity: "important",
    pass: true,
    verdict: `Present (${xfo}). This page cannot be silently framed by another site.`,
    raw: xfo,
  };
}

function checkContentTypeOptions(headers) {
  const value = headers.get("x-content-type-options");
  if (value && value.toLowerCase() === "nosniff") {
    return {
      id: "cto",
      name: "X-Content-Type-Options",
      severity: "important",
      pass: true,
      verdict: "Set to nosniff. Browsers will trust the declared Content-Type instead of guessing — closes off a class of MIME-sniffing attacks.",
      raw: value,
    };
  }
  return {
    id: "cto",
    name: "X-Content-Type-Options",
    severity: "important",
    pass: false,
    verdict: "Missing. Without nosniff, some browsers will try to guess a file's type from its content, which can turn an uploaded file into executable script.",
    raw: value || null,
  };
}

function checkReferrerPolicy(headers) {
  const value = headers.get("referrer-policy");
  if (!value) {
    return {
      id: "referrer",
      name: "Referrer-Policy",
      severity: "recommended",
      pass: false,
      verdict: "Missing. Full URLs — including any tokens or paths that end up in the query string — may leak to third parties via the Referer header.",
      raw: null,
    };
  }
  const looseValues = ["unsafe-url", "no-referrer-when-downgrade"];
  if (looseValues.includes(value.toLowerCase())) {
    return {
      id: "referrer",
      name: "Referrer-Policy",
      severity: "recommended",
      pass: false,
      verdict: `Present but set to "${value}", which still leaks the full URL to other origins on outbound links.`,
      raw: value,
    };
  }
  return {
    id: "referrer",
    name: "Referrer-Policy",
    severity: "recommended",
    pass: true,
    verdict: `Present and reasonably strict ("${value}"). Outbound links won't carry the full URL to third-party origins.`,
    raw: value,
  };
}

function checkPermissionsPolicy(headers) {
  const value = headers.get("permissions-policy");
  if (!value) {
    return {
      id: "permissions",
      name: "Permissions-Policy",
      severity: "recommended",
      pass: false,
      verdict: "Missing. Browser features like camera, microphone, and geolocation are left at their default availability instead of being explicitly scoped down.",
      raw: null,
    };
  }
  return {
    id: "permissions",
    name: "Permissions-Policy",
    severity: "recommended",
    pass: true,
    verdict: "Present. Browser feature access is explicitly declared rather than left open.",
    raw: value,
  };
}

function checkCookies(headers) {
  const setCookie = headers.get("set-cookie");
  if (!setCookie) {
    return {
      id: "cookies",
      name: "Cookie flags",
      severity: "recommended",
      pass: true,
      verdict: "No cookies were set on this response, so there's nothing to flag here.",
      raw: null,
    };
  }
  const missing = [];
  if (!/secure/i.test(setCookie)) missing.push("Secure");
  if (!/httponly/i.test(setCookie)) missing.push("HttpOnly");
  if (!/samesite/i.test(setCookie)) missing.push("SameSite");
  if (missing.length === 0) {
    return {
      id: "cookies",
      name: "Cookie flags",
      severity: "recommended",
      pass: true,
      verdict: "Cookies on this response carry Secure, HttpOnly, and SameSite. That covers the common cookie-theft vectors.",
      raw: setCookie,
    };
  }
  return {
    id: "cookies",
    name: "Cookie flags",
    severity: "recommended",
    pass: false,
    verdict: `Cookies are missing: ${missing.join(", ")}. ${missing.includes("HttpOnly") ? "Without HttpOnly, a successful XSS can read the cookie directly. " : ""}${missing.includes("SameSite") ? "Without SameSite, the cookie can be sent on cross-site requests, which enables CSRF." : ""}`.trim(),
    raw: setCookie,
  };
}

export function runChecks(headers, finalUrl) {
  const isHttps = finalUrl.startsWith("https://");
  const checks = [
    checkCSP(headers),
    checkHSTS(headers, isHttps),
    checkFrameOptions(headers),
    checkContentTypeOptions(headers),
    checkReferrerPolicy(headers),
    checkPermissionsPolicy(headers),
    checkCookies(headers),
  ];

  const totalWeight = checks.reduce((sum, c) => sum + SEVERITY_WEIGHT[c.severity], 0);
  const earnedWeight = checks.reduce(
    (sum, c) => sum + (c.pass ? SEVERITY_WEIGHT[c.severity] : 0),
    0
  );
  const pct = totalWeight === 0 ? 0 : Math.round((earnedWeight / totalWeight) * 100);

  let grade = "F";
  if (pct >= 95) grade = "A+";
  else if (pct >= 85) grade = "A";
  else if (pct >= 70) grade = "B";
  else if (pct >= 55) grade = "C";
  else if (pct >= 35) grade = "D";

  return { checks, score: pct, grade };
}
