/**
 * Need to inject a client-side JavaScript script because
 * https://github.com/babel/website/issues/1527#issuecomment-361671772
 */
const React = require("react");

const CompLibrary = require("../../core/CompLibrary.js");
const Container = CompLibrary.Container;

class Repl extends React.Component {
  render() {
    return (
      <div>
        <Container>
          <link
            rel="stylesheet"
            type="text/css"
            href="https://www.xtuc.fr/editor.css"
          />

          <div className="section line">
            <h1>WebAssembly text format - REPL</h1>
          </div>
        </Container>

        <div style={{display: "flex"}}>

          <div className="window" style={{ width: "45%" }}>
            <div className="window-header">
              <div className="action-buttons" />
              <span className="language">Editor</span>
            </div>
            <div className="window-body" style={{ height: "60vh" }}>
              <div id="container" style={{width: "100%", height: "100%"}}></div>
            </div>
          </div>

          <div className="window" style={{ width: "45%" }}>
            <div className="window-header">
              <div className="action-buttons" />
              <span className="language">Console</span>
            </div>
            <div className="window-body" style={{ height: "60vh" }}>
              <pre className="code-output">
                <code className="language-js" id="output" />
              </pre>
            </div>
          </div>
        </div>

        <script src="https://bundle.run/webassemblyjs@1.2.4"></script>
        <script dangerouslySetInnerHTML={{__html: `var require = { paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.11.1/min/vs' } };`}} />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.11.1/min/vs/loader.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.11.1/min/vs/editor/editor.main.nls.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.11.1/min/vs/editor/editor.main.js"></script>

        <script src="/js/repl.js" />
      </div>
    );
  }
}

module.exports = Repl;
