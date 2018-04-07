const siteConfig = {
  title: "webassemblyjs",
  tagline: "webassemblyjs",
  cname: "webassembly.js.org",
  copyright: "Sven Sauleau",
  url: "https://webassembly.js.org/",
  baseUrl: "/",
  projectName: "webassemblyjs",
  headerLinks: [
    { page: "share", label: "Share" },
    { page: "repl", label: "REPL" },
    { doc: "index", label: "Documentation" },
    {
      href: "https://github.com/xtuc/webassemblyjs",
      label: "GitHub"
    }
  ],
  colors: {
    primaryColor: "#2E8555",
    secondaryColor: "#205C3B"
  },
  highlight: {
    theme: "default"
  },
  stylesheets: ["/css/custom.css"]
};

module.exports = siteConfig;
