import * as chokidar from 'chokidar';
import { debounce } from 'lodash';
import * as anymatch from 'anymatch';

export interface HotReloaderOpts {
  paths: string | string[];
  callback: (string) => void;
  ignores: anymatch.Matcher;
}

class HotReloader {
  private paths: HotReloaderOpts['paths'];
  private ignores: HotReloaderOpts['ignores'];
  private callback: HotReloaderOpts['callback'];
  private ignorer: any;
  private watcher: chokidar.FSWatcher;

  constructor({ paths, callback, ignores }: HotReloaderOpts) {
    this.paths = paths;
    this.ignores = ignores;
    this.callback = callback;
    this.ignorer = anymatch(this.ignores);
    this.watcher = null;
  }

  start() {
    this.watcher = chokidar.watch(this.paths, {
      ignored: this.ignores,
      ignoreInitial: true,
    });

    const handleChange = debounce(file => {
      this.delCache();
      this.callback(file);
    }, 300);

    this.watcher.on('change', handleChange);
  }

  close() {
    this.watcher.close();
    this.watcher = null;
  }

  delCache(cache = require.cache) {
    Object.keys(cache)
      .filter(path => !this.ignorer(path))
      .forEach(path => {
        delete cache[path];
      });
  }
}

export default HotReloader;
