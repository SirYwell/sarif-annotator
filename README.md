<p align="center">
  <a href="https://github.com/actions/typescript-action/actions"><img alt="typescript-action status" src="https://github.com/actions/typescript-action/workflows/build-test/badge.svg"></a>
</p>

# SARIF Annotator

### :rotating_light: Note: This action is not maintained anymore. Use the functionality provided by [Qodana Action](https://github.com/marketplace/actions/qodana-scan) instead. :rotating_light:

This action lets you annotate your code based on SARIF files. Currently, it mainly supports
[Qodana](https://www.jetbrains.com/help/qodana/qodana-sarif-output.html).

## Setup

This is an example workflow that uses Qodana

```yaml
name: code quality
on:
  pull_request:
    branches:
      - master

jobs:
  code-quality:
    runs-on: ubuntu-latest
    name: code-quality qodana
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - uses: actions/setup-java@v2
        with:
          java-version: 11
          distribution: temurin
      - name: Qodana - Code Inspection
        id: qodana
        uses: JetBrains/qodana-action@v3.2.1
      - name: SARIF Annotator
        uses: SirYwell/sarif-annotator@v0.1.0
        with:
          source: qodana
          report-path: ${{ steps.qodana.outputs.results-json-path }}
```
(*Note: This will annotate all issues found by Qodana, not only problems introduced by the Pull Request*)
