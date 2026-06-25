// Resolves the correct release asset for a given product + platform from the
// product's `latest-successful-build` GitHub release and 302-redirects to it.
// Degrades gracefully to the releases page on any error so links never break.

const TOKEN = process.env.GITHUB_TOKEN; // optional, set in Vercel project settings
const TAG = 'latest-successful-build';

// Per-product asset matching. An asset must contain ALL `contains` tokens
// (case-insensitive). Within the first matching extension (in `ext` order), a
// name containing a `prefer` token wins, otherwise the first match is used.
const PRODUCTS = {
  'gravity-torrent': {
    owner: 'teamantigravity',
    repo: 'gravity-torrent',
    platforms: {
      android: { contains: ['android'], ext: ['.apk'] },
      ios: { contains: ['ios'], ext: ['.ipa', '.zip'] },
      macos: { contains: ['macos'], ext: ['.dmg', '.zip'] },
      // Prefer the portable .exe installer, then the Store .msix, then any zip.
      windows: { contains: ['windows'], ext: ['.exe', '.msix', '.zip'] },
      linux: { contains: ['linux', 'x64'], ext: ['.zip', '.deb', '.appimage'] },
      'linux-arm64': { contains: ['linux', 'arm64'], ext: ['.zip', '.deb', '.appimage'] },
    },
  },
  gravitysend: {
    owner: 'teamantigravity',
    repo: 'gravitysend',
    platforms: {
      // Multiple ABIs are published; arm64 covers essentially all modern phones.
      android: { contains: ['android'], ext: ['.apk'], prefer: ['arm64'] },
      macos: { contains: ['macos'], ext: ['.dmg'] },
      windows: { contains: ['windows'], ext: ['.exe', '.msix'] },
      linux: { contains: ['linux'], ext: ['.deb', '.tar.gz', '.appimage', '.zip'] },
    },
  },
};

function pickAsset(assets, spec) {
  const candidates = assets.filter((a) =>
    spec.contains.every((tok) => a.name.toLowerCase().includes(tok)),
  );
  if (candidates.length === 0) return null;
  for (const ext of spec.ext) {
    const matchingExt = candidates.filter((a) => a.name.toLowerCase().endsWith(ext));
    if (matchingExt.length === 0) continue;
    if (spec.prefer) {
      for (const p of spec.prefer) {
        const hit = matchingExt.find((a) => a.name.toLowerCase().includes(p));
        if (hit) return hit;
      }
    }
    return matchingExt[0];
  }
  return candidates[0];
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  const productKey = String(req.query.product || 'gravity-torrent').toLowerCase();
  const product = PRODUCTS[productKey];
  const platform = String(req.query.platform || '').toLowerCase();

  if (!product) {
    res.status(400).json({ error: 'Unknown product', supported: Object.keys(PRODUCTS) });
    return;
  }

  const releasesPage = `https://github.com/${product.owner}/${product.repo}/releases`;
  const spec = product.platforms[platform];

  if (!spec) {
    res.status(400).json({
      error: 'Unknown or missing platform for this product',
      supported: Object.keys(product.platforms),
      fallback: releasesPage,
    });
    return;
  }

  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
  };

  try {
    const relUrl = `https://api.github.com/repos/${product.owner}/${product.repo}/releases/tags/${TAG}`;
    const relRes = await fetch(relUrl, { headers });
    if (!relRes.ok) throw new Error(`HTTP ${relRes.status} on release`);
    const release = await relRes.json();

    const asset = pickAsset(release.assets || [], spec);
    if (!asset) {
      // No asset for this platform yet — send the user to the releases page.
      res.setHeader('Cache-Control', 's-maxage=30');
      res.redirect(302, releasesPage);
      return;
    }

    res.redirect(302, asset.browser_download_url);
  } catch (err) {
    console.error('latest-download error:', err.message);
    res.setHeader('Cache-Control', 's-maxage=15');
    res.redirect(302, releasesPage);
  }
}
