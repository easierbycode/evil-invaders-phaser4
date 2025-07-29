// === CONFIGURATION FROM ENVIRONMENT ===
const GITHUB_TOKEN = Deno.env.get("GITHUB_PERSONAL_ACCESS_TOKEN");
const REPO_OWNER = Deno.env.get("GITHUB_USERNAME");
const REPO_NAME = Deno.env.get("GITHUB_REPOSITORY_NAME");

if (!GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME) {
  console.error("❌ Missing required environment variables.");
  Deno.exit(1);
}

// === PARSE ISSUES FROM README ===
async function parseIssuesFromReadme(path: string) {
  const content = await Deno.readTextFile(path);
  const issuesSection = content.split("### Issues")[1] || "";
  const rawIssues = issuesSection.split("---").map((b) => b.trim()).filter(Boolean);

  const issues = [];

  for (const block of rawIssues) {
    const titleMatch = block.match(/\*\*Title:\*\*\s*(.+)/);
    const bodyMatch = block.match(/\*\*Body:\*\*\s*([\s\S]+?)(?=\n\*\*Labels:|\Z)/);
    const labelsMatch = block.match(/\*\*Labels:\*\*\s*(.+)/);

    if (titleMatch && bodyMatch && labelsMatch) {
      issues.push({
        title: titleMatch[1].trim(),
        body: bodyMatch[1].trim(),
        labels: labelsMatch[1].split(",").map((l) => l.trim()),
      });
    }
  }

  return issues;
}

// === CREATE ISSUES ON GITHUB ===
async function createIssue(issue: { title: string; body: string; labels: string[] }) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(issue),
  });

  const remaining = response.headers.get("X-RateLimit-Remaining");
  const reset = response.headers.get("X-RateLimit-Reset");

  if (response.status === 201) {
    console.log(`✅ Created issue: ${issue.title}`);
  } else if (response.status === 403 && remaining === "0" && reset) {
    const resetTime = new Date(parseInt(reset, 10) * 1000);
    const waitTime = resetTime.getTime() - Date.now();
    console.log(`⏳ Rate limit exceeded. Waiting until ${resetTime.toLocaleTimeString()}...`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    await createIssue(issue); // Retry
  } else {
    const error = await response.text();
    console.error(`❌ Failed to create issue: ${issue.title}`);
    console.error(`Status: ${response.status} - ${error}`);
  }
}

// === MAIN EXECUTION ===
const issues = await parseIssuesFromReadme("ISSUES.md");
for (const issue of issues) {
  await createIssue(issue);
}
