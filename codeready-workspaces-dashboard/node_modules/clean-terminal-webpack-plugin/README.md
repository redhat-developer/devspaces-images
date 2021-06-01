# Clean Terminal Webpack Plugin

Cleans your terminal output during development to only show the latest build
information.

# Install

Via npm:

```
npm i -D clean-terminal-webpack-plugin
```

# Usage

Via webpack config file:

```js
// webpack.config.js

const CleanTerminalPlugin = require('clean-terminal-webpack-plugin');

module.exports = {
  plugins: [new CleanTerminalPlugin()]
};
```

# API

The plugin accepts an `options` Object:

| Key               | Type    | Required | Default     | Description                                       |
| ----------------- | ------- | -------- | ----------- | ------------------------------------------------- |
| `message`         | String  | no       | `undefined` | Message to be printed                             |
| `onlyInWatchMode` | Boolean | no       | `true`      | Only clear the screen if webpack is in watch mode |
| `skipFirstRun`    | Boolean | no       | `false`     | Don't clear the screen on first webpack run       |
| `beforeCompile`   | Boolean | no       | `false`     | Clear screen before compiling instead of after  (v3 and above) |

## Example

```js
// webpack.config.js

const CleanTerminalPlugin = require('clean-terminal-webpack-plugin');

const HOST = 'localhost';
const PORT = 8888;

module.exports = {
  plugins: [
    new CleanTerminalPlugin({
      message: `dev server running on http://${HOST}:${PORT}`,
      onlyInWatchMode: false
    })
  ]
};
```

# Development

Lint source code with:

```
npm run lint
```

Lint and format (prettier) source code with:

```
npm run lint:format
```

# Contributing

Please read the [Contributing Guidelines](CONTRIBUTING.md) first.
