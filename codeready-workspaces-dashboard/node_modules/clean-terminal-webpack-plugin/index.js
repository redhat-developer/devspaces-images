'use strict';

class CleanTerminalPlugin {
  constructor(options = {}) {
    const { message, onlyInWatchMode = true, skipFirstRun = false, beforeCompile = false } = options;

    this.message = message;
    this.onlyInWatchMode = onlyInWatchMode;
    this.skipFirstRun = skipFirstRun;
    this.beforeCompile = beforeCompile;
    this.firstRun = true;
  }

  apply(compiler) {
    let hook = compiler.hooks.afterCompile;
    if (this.beforeCompile) {
      hook = compiler.hooks.beforeCompile;
    }
    hook.tap('CleanTerminalPlugin', () => {
      if (this.shouldClearConsole(compiler)) {
        this.clearConsole();
      }
    });
  }

  shouldClearConsole(compiler) {
    if (this.firstRun) {
      this.firstRun = false;

      if (this.skipFirstRun) {
        return false;
      }
    }

    if (this.onlyInWatchMode) {
      return Boolean(compiler.watchMode);
    }

    const isNodeEnvProduction = process.env.NODE_ENV === 'production';
    const isOptionsModeProduction = Boolean(
      compiler.options && compiler.options.mode === 'production'
    );

    return !isNodeEnvProduction && !isOptionsModeProduction;
  }

  clearConsole() {
    const clear = '\x1B[2J\x1B[3J\x1B[H';
    const output = this.message ? `${clear + this.message}\n\n` : clear;

    process.stdout.write(output);
  }
}

module.exports = CleanTerminalPlugin;
