const user = "Haselnussbomber";
const repos = [
  "HaselTweaks",
  "LeveHelper",
];

const output = await Promise.all(repos.map(async (repo) => {
  const res = await fetch(`https://api.github.com/repos/${user}/${repo}/releases/latest`);
  const data = await res.json();
  return {
    Author: user,
    Name: repo,
    InternalName: repo,
    AssemblyVersion: data.tag_name.replace(/^v/, ""),
    RepoUrl: `https://github.com/${user}/${repo}`,
    Changelog: data.body.replace(/\p{Extended_Pictographic}/gu, ""),
    ApplicableVersion: "any",
    DalamudApiLevel: 6,
    DownloadCount: data.assets[0].download_count,
    LastUpdate: new Date(data.published_at).valueOf() / 1000,
    DownloadLinkInstall: data.assets[0].browser_download_url,
    DownloadLinkUpdate: data.assets[0].browser_download_url,
  };
}));

await Deno.writeTextFile("repo.json", JSON.stringify(output, null, 2));
