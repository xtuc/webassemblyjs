const siteConfig = {
  title: "WebAssembly interpreter",
  tagline: "WebAssembly interpreter",
  cname: "webassembly.js.org",
  copyright: "Sven Sauleau",
  url: "https://webassembly.js.org/",
  baseUrl: "/",
  projectName: "js-webassembly-interpreter",
  headerLinks: [
    { page: "share", label: "Share" },
    { doc: "index", label: "Documentation" },
    {
      href: "https://github.com/xtuc/js-webassembly-interpreter",
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
