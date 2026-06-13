const WORKFLOWS = {
  android: 'build_android_apk.yml',
  ios:     'build_ios.yml',
  macos:   'build_macos.yml',
  windows: 'build_windows.yml',
  linux:   'build_linux.yml',
};
const OWNER  = 'teamantigravity';
const REPO   = 'gravitysend';
const TOKEN  = process.env.GITHUB_TOKEN; // set in Vercel project settings
const BRANCH = 'main';

export default async function handler(req, res) {
  // Allow caching for 30 seconds, stale-while-revalidate for 60 seconds
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const headers = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {}),
  };

  const results = await Promise.allSettled(
    Object.entries(WORKFLOWS).map(async ([key, file]) => {
      const url = `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${file}/runs?per_page=1&branch=${BRANCH}`;
      const r   = await fetch(url, { headers });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d   = await r.json();
      return [key, d.workflow_runs?.[0] ?? null];
    })
  );

  const statuses = {};
  results.forEach((r) => {
    if (r.status === 'fulfilled') {
      const [key, run] = r.value;
      statuses[key] = run
        ? { status: run.status, conclusion: run.conclusion, url: run.html_url, date: run.created_at }
        : null;
    } else {
      console.error('Error fetching a workflow run:', r.reason);
    }
  });

  res.status(200).json(statuses);
}
