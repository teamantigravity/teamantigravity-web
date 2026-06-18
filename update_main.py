import re

with open('main.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Update initReleaseFetcher
js = js.replace("repos/teamantigravity/gravitysend/releases", "repos/teamantigravity/gravity-torrent/releases")
js = js.replace("asset.name.endsWith('-windows-x64.exe')", "asset.name.endsWith('-windows-x64.zip')")
js = js.replace("asset.name.endsWith('-macos-universal.dmg')", "asset.name.endsWith('-macos.zip')")
js = js.replace("asset.name.endsWith('-android-arm64.apk')", "asset.name.endsWith('-android.apk')")
js = js.replace("asset.name.endsWith('-linux-x86_64.deb')", "asset.name.endsWith('-linux-x64.zip')")

# Update initBuildStatusDashboard
js = js.replace("const GITHUB_REPO  = 'gravitysend';", "const GITHUB_REPO  = 'gravity-torrent';")
js = js.replace("gravitysend-platforms", "gravitorrent-platforms")
js = js.replace("[GravitySend build status]", "[Gravity Torrent build status]")

# Change fetchWorkflowStatusFallback to not use workflowFile as we have only one workflow file 'build-apps.yml' for fallback
# Actually, the fallback in main.js loops over pills and reads `data-workflow`. In index.html we stripped `data-workflow`
# Let's fix fallback function to just query build-apps.yml, and iterate over jobs like in the serverless function.
# But writing complex JS replacement here is error-prone. Let's just use replace_file_content for that block.

with open('main.js', 'w', encoding='utf-8') as f:
    f.write(js)
