const user = "Haselnussbomber";
const repos = [
  "HaselTweaks",
  "LeveHelper",
  "MogMogCheck",
];

const clearText = (str) => {
  return str
    .replace(/\p{Extended_Pictographic}/gu, "") // remove emojis
    .replace(/\*\*(.*)\*\*/g, "$1") // extract markdown bold text
    .replace(/\[([^\)]+)\]\([^\)]+\)/g, "$1") // extract markdown link label
    .split(/\r?\n/g)
    .map(line => line.replace(/^#+\s+/g, ""))
    .join("\n");
};

const output = await Promise.all(repos.map(async (repo) => {
  let res = await fetch(`https://api.github.com/repos/${user}/${repo}/releases/latest`);
  const latest = await res.json();
  let out = {
    AssemblyVersion: latest.tag_name.replace(/^v/, ""),
    Changelog: clearText(latest.body),
    DownloadCount: latest.assets[0].download_count,
    LastUpdate: new Date(latest.published_at).valueOf() / 1000,
    DownloadLinkInstall: latest.assets[0].browser_download_url,
    DownloadLinkUpdate: latest.assets[0].browser_download_url,
  };

  let manifest = {
    Author: user,
    Name: repo,
    InternalName: repo,
    RepoUrl: `https://github.com/${user}/${repo}`,
    ApplicableVersion: "any",
    DalamudApiLevel: 6,
  };
  const manifestAsset = latest.assets.find(asset => asset.name == "manifest.json");
  if (manifestAsset) {
    const manifestRes = await fetch(manifestAsset.browser_download_url);
    if (manifestRes.ok) {
      manifest = await manifestRes.json();
    }
  }

  out = Object.assign(manifest, out);

  const prereleaseRes = await fetch(`https://api.github.com/repos/${user}/${repo}/releases/tags/prerelease`);
  if (prereleaseRes.ok) {
    const prerelease = await prereleaseRes.json();
    const prereleaseManifestAsset = prerelease.assets.find(asset => asset.name == "manifest.json");
    if (prereleaseManifestAsset) {
      const prereleaseManifestRes = await fetch(prereleaseManifestAsset.browser_download_url);
      const prereleaseManifest = await prereleaseManifestRes.json();

      out.DownloadLinkTesting = prerelease.assets[0].browser_download_url;
      out.TestingAssemblyVersion = prereleaseManifest.AssemblyVersion;
    }
  }

  return out;
}));

await Deno.writeTextFile("repo.json", JSON.stringify(output, null, 2));
