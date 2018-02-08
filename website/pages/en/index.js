const React = require("react");
const fs = require("fs");

const CompLibrary = require("../../core/CompLibrary.js");
const MarkdownBlock = CompLibrary.MarkdownBlock;
const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;

const indexContent = fs.readFileSync(process.cwd() + "/../README.md", "utf8");

class Index extends React.Component {
  render() {
    return (
      <Container>
        <MarkdownBlock>{indexContent}</MarkdownBlock>
      </Container>
    );
  }
}

module.exports = Index;
