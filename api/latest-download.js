const OWNER = 'teamantigravity';
const REPO = 'gravity-torrent';
const TAG = 'latest-successful-build';
const TOKEN = process.env.GITHUB_TOKEN; // optional, set in Vercel project settings
const RELEASES_PAGE = `https://github.com/${OWNER}/${REPO}/releases`;

// Required name substrings + extension preference (highest priority first)
// per platform. An asset must contain ALL `contains` tokens (case-insensitive)
// to be considered, then the earliest matching extension wins.
const PLATFORMS = {
  android: { contains: ['android'], ext: ['.apk'] },
  ios: { contains: ['ios'], ext: ['.ipa', '.zip'] },
  macos: { contains: ['macos'], ext: ['.dmg', '.zip'] },
  // Windows: the CI .msix is a Microsoft Store package (not directly
  // sideloadable), so the portable .zip is preferred for end users.
  windows: { contains: ['windows'], ext: ['.zip', '.msix'] },
  linux: { contains: ['linux', 'x64'], ext: ['.deb', '.appimage', '.zip'] },
  'linux-arm64': { contains: ['linux', 'arm64'], ext: ['.deb', '.appimage', '.zip'] },
};

function pickAsset(assets, spec) {
  const candidates = assets.filter((a) => {
    const name = a.name.toLowerCase();
    return spec.contains.every((tok) => name.includes(tok));
  });
  if (candidates.length === 0) return null;
  for (const ext of spec.ext) {
    const hit = candidates.find((a) => a.name.toLowerCase().endsWith(ext));
    if (hit) return hit;
  }
  // Fall back to any matching asset if no preferred extension matched.
  return candidates[0];
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  const platform = String(req.query.platform || '').toLowerCase();
  const spec = PLATFORMS[platform];

  if (!spec) {
    res.status(400).json({
      error: 'Unknown or missing platform',
      supported: Object.keys(PLATFORMS),
      fallback: RELEASES_PAGE,
    });
    return;
  }

  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
  };

  try {
    const relUrl = `https://api.github.com/repos/${OWNER}/${REPO}/releases/tags/${TAG}`;
    const relRes = await fetch(relUrl, { headers });
    if (!relRes.ok) throw new Error(`HTTP ${relRes.status} on release`);
    const release = await relRes.json();

    const asset = pickAsset(release.assets || [], spec);
    if (!asset) {
      // No asset for this platform yet — send the user to the releases page.
      res.setHeader('Cache-Control', 's-maxage=30');
      res.redirect(302, RELEASES_PAGE);
      return;
    }

    res.redirect(302, asset.browser_download_url);
  } catch (err) {
    console.error('latest-download error:', err.message);
    // On any failure (rate limit, timeout, outage) degrade gracefully to the
    // public releases page so the link is never broken.
    res.setHeader('Cache-Control', 's-maxage=15');
    res.redirect(302, RELEASES_PAGE);
  }
}
