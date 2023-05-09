# Releasing

We used Lerna in the past to release the webassemblyjs packages, however this flow broken.

To bump the version, manually replace the versions:
```
find . -name "*.json" -exec sed -i "s/old-version/new-version/g" {} +
find . -name "*.lock" -exec sed -i "s/old-version/new-version/g" {} +
```

Build the project: `make build`.

To publish on npm, go in every ./packages/* folder and type `npm publish`.
