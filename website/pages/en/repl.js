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
      <Container>
        <link
          rel="stylesheet"
          type="text/css"
          href="https://www.xtuc.fr/editor.css"
        />

        <div className="section line">
          <h1>WebAssembly text format - REPL</h1>
        </div>

        <div className="window" style={{ width: "900px" }}>
          <div className="window-header">
            <div className="action-buttons" />
            <span className="language">REPL</span>
          </div>
          <div className="window-body" style={{ height: "345px;" }}>
            <pre className="code-output">
              <code className="language-js" id="exec" />
            </pre>
          </div>
        </div>

        <form id="input">
          <input style={{ width: "100%" }} id="value" />
        </form>

        <script src="https://bundle.run/@webassemblyjs/repl@1.2.2-1" />
        <script src="/js/repl.js" />
      </Container>
    );
  }
}

module.exports = Repl;
