Mocha Esbuild
=============
[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@rtvision/mocha-esbuild.svg)](https://npmjs.org/package/@rtvision/mocha-esbuild)
[![Downloads/week](https://img.shields.io/npm/dw/@rtvision/mocha-esbuild.svg)](https://npmjs.org/package/@rtvision/mocha-esbuild)
[![License](https://img.shields.io/npm/l/@rtvision/mocha-esbuild.svg)](https://github.com/RtVision/mocha-esbuild/blob/master/package.json)


Run tests with mocha compiled by esbuild at lightning fast [speeds](https://esbuild.github.io/). 

CLI requires a .esbuildrc.js file with an annotated example [here](https://github.com/RtVision/mocha-esbuild/blob/master/.esbuildrc.js)
while its possible it would work only the defaults it really depends on your projects setup.

I personally made this CLI to compile vue SFC components that are then tested with mocha and have seen pretty big speed increases.
One in partically that stood out to me was webpack building a single test file and all its dependencies took 1 minute and 15s while
esbuild did it in about 15s. When developing tests this time saving really adds up!

If you need alias's to work like webpacks common @ resolving to ./src then you can add a tsconfig.json or a jsconfig.json file and add
the aliases like described [here](https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping). You can use
this even if you don't have any typescript in your project since esbuild will look at your config file regardless.

If you want to use sourcemaps, you will need to either start mocha-esbuild with the node --enable-source-maps flag i.e.
`node --enable-source-maps node_modules/@rtvision/bin/run -s --noImportSourceMapSupport` or do `npm install --save-dev source-map-support`.
[Until node allows scripts to determine](https://github.com/nodejs/node/issues/38817) whether or not sources maps should be on this is only solution I know of.
Note that this does introduce some big overhead for bigger files/projects, I myself notice several seconds of slowdown in startup time of the tests. I only enable it while developing tests or rerunning a failed test locally.


# Install
``` sh-session
npm i --save-dev @rtvision/mocha-esbuild
```

# Usage
```sh-session
npx mocha-esbuild --help
Run tests with mocha compiled by esbuild

USAGE
  $ mocha-esbuild [FILE]

ARGUMENTS
  FILE  [default: test/unit/**/*.spec.js] File path to the entry point to build from. Can be 1 specific file or take a globstar such as 'test/unit/**/*.spec.js'

OPTIONS
  -b, --bail                         Bail on the first test failure.
  -c, --color                        Color TTY output from reporter.
  -g, --grep=grep                    Test filter given regular expression.
  -h, --help                         show CLI help
  -p, --parallel                     Run test in parallel.
  -r, --require=require              Pathname of file that will be imported before tests run
  -s, --sourcemaps                   Generates inline sourcemaps for easier debugging. Will overwrite sourcemaps if custom config provided
  -t, --timeout=timeout              Timeout threshold value for mocha.
  -v, --version                      show CLI version
  -w, --watch                        Enable watch mode for esbuild. Will overwrite watch if custom config provided
  --esbuildConfig=esbuildConfig      [default: .esbuildrc.js] Esbuild config file path. The follow options will always be overwritten: bundle, stdin/entryPoints, and outfile
  --fgrep=fgrep                      Test filter given string
  --fullTrace=fullTrace              Full stacktrace upon failure?
  --invert                           Invert test filter matches?
  --jobs=jobs                        Max number of worker processes for parallel runs
  --mochaConfigPath=mochaConfigPath  Filepath to read mocha configs from, can be js or json file
  --reporter=reporter                Reporter name to use
  --retries=retries                  Number of times to retry failed tests
```

## License
MIT © RtVision
