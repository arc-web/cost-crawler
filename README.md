# cost-crawler

Codebase analyzer for identifying model/provider selection mechanisms and cost implications in LLM-integrated projects.

## Stack

- TypeScript (Node.js)
- `@babel/parser` + `@babel/traverse` for AST analysis
- `commander` for CLI
- Jest for tests

## Install

```bash
npm install
```

## Build

```bash
npm run build
```

## Test

```bash
npm test
```

## CLI Usage

```bash
# Analyze a codebase using default patterns (src/**/*.ts, src/**/*.js)
node bin/cost-crawler.js analyze <repoPath>

# Specify custom glob patterns
node bin/cost-crawler.js analyze <repoPath> -p "**/*.ts" "**/*.js"

# Output as JSON
node bin/cost-crawler.js analyze <repoPath> -o json

# Write report to file
node bin/cost-crawler.js analyze <repoPath> -f report.json
```

### Example

```bash
node bin/cost-crawler.js analyze /path/to/project -o json -f results.json
```
