// Returns per-platform CI status for a product.
//   gravity-torrent: one workflow (build-apps.yml) whose JOB names are the
//                    platform keys.
//   gravitysend:     a separate workflow file PER platform.
// Output shape (per platform): { status, conclusion, url, date }

const OWNER = 'teamantigravity';
const TOKEN = process.env.GITHUB_TOKEN; // set in Vercel project settings
const BRANCH = 'main';

const PRODUCTS = {
  'gravity-torrent': {
    repo: 'gravity-torrent',
    mode: 'jobs',
    workflow: 'build-apps.yml',
    platforms: ['android', 'ios', 'macos', 'windows', 'linux', 'linux-arm64'],
  },
  gravitysend: {
    repo: 'gravitysend',
    mode: 'workflows',
    workflows: {
      android: 'build_android_apk.yml',
      ios: 'build_ios.yml',
      macos: 'build_macos.yml',
      windows: 'build_windows.yml',
      linux: 'build_linux.yml',
    },
  },
};

async function ghJson(url, headers) {
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`HTTP ${r.status} on ${url}`);
  return r.json();
}

async function latestRun(repo, workflowFile, headers) {
  const url = `https://api.github.com/repos/${OWNER}/${repo}/actions/workflows/${workflowFile}/runs?per_page=1&branch=${BRANCH}`;
  const data = await ghJson(url, headers);
  return data.workflow_runs?.[0] || null;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const productKey = String(req.query.product || 'gravity-torrent').toLowerCase();
  const product = PRODUCTS[productKey];
  if (!product) {
    return res.status(400).json({ error: 'Unknown product', supported: Object.keys(PRODUCTS) });
  }

  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
  };

  const statuses = {};

  try {
    if (product.mode === 'jobs') {
      const run = await latestRun(product.repo, product.workflow, headers);
      if (!run) return res.status(200).json({});
      const jobsData = await ghJson(run.jobs_url, headers);
      for (const job of jobsData.jobs || []) {
        const name = job.name.toLowerCase();
        if (product.platforms.includes(name)) {
          statuses[name] = {
            status: job.status,
            conclusion: job.conclusion,
            url: job.html_url,
            date: job.started_at || job.created_at,
          };
        }
      }
    } else {
      // One workflow per platform — fetch their latest runs in parallel.
      const entries = Object.entries(product.workflows);
      const runs = await Promise.allSettled(
        entries.map(([, wf]) => latestRun(product.repo, wf, headers)),
      );
      entries.forEach(([platform], i) => {
        const r = runs[i];
        if (r.status === 'fulfilled' && r.value) {
          const run = r.value;
          statuses[platform] = {
            status: run.status,
            conclusion: run.conclusion,
            url: run.html_url,
            date: run.run_started_at || run.created_at,
          };
        }
      });
    }

    res.status(200).json(statuses);
  } catch (err) {
    console.error('build-status error:', err.message);
    res.status(500).json({ error: 'Failed to fetch build status' });
  }
}
