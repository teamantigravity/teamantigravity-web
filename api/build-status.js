const OWNER  = 'teamantigravity';
const REPO   = 'gravity-torrent';
const WORKFLOW_FILE = 'build-apps.yml';
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

  try {
    // 1. Fetch latest workflow run for build-apps.yml
    const runUrl = `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW_FILE}/runs?per_page=1&branch=${BRANCH}`;
    const runRes = await fetch(runUrl, { headers });
    if (!runRes.ok) throw new Error(`HTTP ${runRes.status} on runs`);
    const runData = await runRes.json();
    const latestRun = runData.workflow_runs?.[0];

    if (!latestRun) {
      return res.status(200).json({});
    }

    // 2. Fetch jobs for the latest workflow run
    const jobsUrl = latestRun.jobs_url;
    const jobsRes = await fetch(jobsUrl, { headers });
    if (!jobsRes.ok) throw new Error(`HTTP ${jobsRes.status} on jobs`);
    const jobsData = await jobsRes.json();

    const statuses = {};
    const jobMapping = {
      android: 'android',
      ios: 'ios',
      macos: 'macos',
      windows: 'windows',
      linux: 'linux'
    };

    for (const job of jobsData.jobs || []) {
      const platform = Object.keys(jobMapping).find(k => job.name.toLowerCase() === jobMapping[k]);
      if (platform) {
        statuses[platform] = {
          status: job.status,
          conclusion: job.conclusion,
          url: job.html_url,
          date: job.started_at || job.created_at,
        };
      }
    }

    res.status(200).json(statuses);
  } catch (err) {
    console.error('Error fetching build status:', err);
    res.status(500).json({ error: 'Failed to fetch build status' });
  }
}
