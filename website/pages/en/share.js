/**
 * Need to inject a client-side JavaScript script because
 * https://github.com/babel/website/issues/1527#issuecomment-361671772
 */
const React = require("react");

const CompLibrary = require("../../core/CompLibrary.js");
const MarkdownBlock = CompLibrary.MarkdownBlock;
const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;

class Share extends React.Component {
  render() {
    return (
      <Container>
        <link
          rel="stylesheet"
          type="text/css"
          href="https://www.xtuc.fr/editor.css"
        />

        <div style={{marginTop: "30px", textAlign: "center"}}>
          <input type="file" id="upload" />
          <button id="download">download module.wasm</button>
        </div>

        <div className="window" style={{ width: "80%" }}>
          <div className="window-header">
            <div className="action-buttons" />

            <span className="language">WAST</span>
          </div>
          <div className="window-body" style={{ height: "50%" }}>
            <pre className="code-output" id="output"></pre>
          </div>
        </div>

        <script src="https://bundle.run/webassembly-interpreter@0.0.20/lib/tools.js" />
        <script src="/js/share.js" />
      </Container>
    );
  }
}

module.exports = Share;
