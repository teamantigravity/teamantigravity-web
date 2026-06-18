import re

with open('main.js', 'r', encoding='utf-8') as f:
    js = f.read()

replacement = """  async function fetchWorkflowStatusFallback(pills) {
    try {
      // 1. Fetch latest workflow run
      const runRes = await fetch(`${BASE_URL}/build-apps.yml/runs?per_page=1&branch=main`, {
        headers: { 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }
      });
      if (!runRes.ok) throw new Error(`HTTP ${runRes.status} on runs`);
      const runData = await runRes.json();
      const latestRun = runData.workflow_runs?.[0];
      if (!latestRun) throw new Error('No runs found');

      // 2. Fetch jobs
      const jobsRes = await fetch(latestRun.jobs_url, {
        headers: { 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }
      });
      if (!jobsRes.ok) throw new Error(`HTTP ${jobsRes.status} on jobs`);
      const jobsData = await jobsRes.json();

      const jobMapping = {
        android: 'android',
        ios: 'ios',
        macos: 'macos',
        windows: 'windows',
        linux: 'linux'
      };

      pills.forEach(pill => {
        const platform = pill.getAttribute('data-platform');
        const jobName = jobMapping[platform];
        if (jobName) {
          const job = jobsData.jobs?.find(j => j.name.toLowerCase() === jobName);
          const s = resolveStatus(job);
          updatePill(pill, s);
        }
      });
    } catch (err) {
      console.warn('[Gravity Torrent build status] Direct fetch fallback failed:', err.message);
      pills.forEach(pill => {
        const dot = pill.querySelector('.status-dot');
        if (dot) dot.className = 'status-dot status-unknown';
        pill.setAttribute('data-tooltip', 'Status unavailable');
      });
    }
  }

  async function loadBuildStatuses() {
    const container = document.getElementById('gravitorrent-platforms');
    if (!container) return;

    const pills = container.querySelectorAll('.platform-pill');
    const updatedEl = document.getElementById('build-updated-time');

    let processedViaAPI = false;

    // Try Vercel Serverless Function first
    try {
      const res = await fetch('/api/build-status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const statuses = await res.json();

      pills.forEach(pill => {
        const platform = pill.getAttribute('data-platform');
        if (platform && statuses[platform] !== undefined) {
          const run = statuses[platform];
          const s = resolveStatus(run);
          updatePill(pill, s);
        }
      });
      processedViaAPI = true;
    } catch (err) {
      console.log('[Gravity Torrent build status] Vercel proxy unavailable, falling back to direct GitHub API:', err.message);
    }

    // Fallback: fetch directly from GitHub
    if (!processedViaAPI) {
      await fetchWorkflowStatusFallback(pills);
    }"""

# The chunk we want to replace
pattern = r'  async function fetchWorkflowStatusFallback\(pill, workflowFile\) \{.*?if \(\!processedViaAPI\) \{\n      const promises = Array\.from\(pills\)\.map\(pill => \{\n        const workflowFile = pill\.getAttribute\(\'data-workflow\'\);\n        if \(workflowFile\) \{\n          return fetchWorkflowStatusFallback\(pill, workflowFile\);\n        \}\n      \}\);\n      await Promise\.allSettled\(promises\);\n    \}'

js = re.sub(pattern, replacement, js, flags=re.DOTALL)

with open('main.js', 'w', encoding='utf-8') as f:
    f.write(js)
