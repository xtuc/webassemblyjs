/**
 * Need to inject a client-side JavaScript script because
 * https://github.com/babel/website/issues/1527#issuecomment-361671772
 */
const React = require("react");

const CompLibrary = require("../../core/CompLibrary.js");
const Container = CompLibrary.Container;

class Share extends React.Component {
  render() {
    return (
      <Container>
        <link
          rel="stylesheet"
          type="text/css"
          href="https://www.xtuc.fr/editor.css"
        />

        <link
          rel="stylesheet"
          type="text/css"
          href="/css/share.css"
        />

        <div style={{marginTop: "30px", textAlign: "center"}}>
          <input type="file" id="upload" />
          <button id="download">download module.wasm</button>
        </div>

        <div className="window" style={{ width: "80%" }}>
          <div className="window-header">
            <div className="action-buttons" />

            <span className="language"><code>wasmgen -o text</code></span>
          </div>
          <div className="window-body" id="wasmgen-editor">
            <pre className="code-output" id="wasmgen-output"></pre>
          </div>
        </div>

        <div className="window" style={{ width: "80%" }}>
          <div className="window-header">
            <div className="action-buttons" />

            <span className="language"><code>wasm2wast</code></span>
          </div>
          <div className="window-body" id="wasm2wast-editor">
            <pre className="code-output" id="wasm2wast-output"></pre>
          </div>
        </div>

        <script src="https://bundle.run/wasmgen@1.4.1" />
        <script src="https://bundle.run/webassembly-interpreter@0.0.29/lib/tools.js" />
        <script src="/js/share.js" />

        <p style={{textAlign: 'center'}}>
          You can find more information about these tools <a href="/docs/usage.html">here</a>.
        </p>
      </Container>
    );
  }
}

module.exports = Share;
