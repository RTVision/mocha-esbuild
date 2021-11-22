import { existsSync as fileExists } from 'fs';
import FastGlob from 'fast-glob';
import { build as Esbuild, BuildOptions as EsbuildOptions } from 'esbuild';
import { EsbuildFlags } from './types';
import { importESM, resolveRelativePath } from './Helpers';

// this function will change a property on that object so
// need to be a reference and not a copy
function addTopLevelRequire (config : EsbuildOptions) {
	// add js to top of file if output format is ESM.
	// JS will create top level require that dependencies may need
	if (config.format?.toLowerCase() === 'esm') {
		// https://github.com/evanw/esbuild/issues/946#issuecomment-814703190
		const jsBanner = `import { createRequire as topLevelCreateRequire } from 'module';\nconst require = topLevelCreateRequire(import.meta.url);`;
		addJsBanner(config, jsBanner);
	}
}

function addJsBanner (config: EsbuildOptions, jsBanner: string) {
	if (typeof config.banner === 'undefined') {
		config.banner = {
			js: jsBanner
		};
	} else if (typeof config.banner.js === 'undefined') {
		config.banner.js = jsBanner;
	} else {
		config.banner.js = `${jsBanner}\n${config.banner.jsBanner}`;
	}
	return config;
}

export default async function (entryPoint : string, outputFile : string, { watch, sourcemaps, esbuildConfigPath, onRebuild } : EsbuildFlags) {
	entryPoint = resolveRelativePath(entryPoint);

	// doesn't return any files if just plain import path;
	let importFiles : Array<string> = await FastGlob(entryPoint);
	if (importFiles.length === 0) importFiles = [entryPoint];

	// force these specific options
	let esbuildConfig : EsbuildOptions = {
		// need to have 1 central file to import the globs so create it
		stdin: {
			contents: importFiles.map(f => `import '${f}';`).join('\n'),
			resolveDir: process.cwd(),
			sourcefile: 'Tests Entry Point'
		},
		bundle: true,
		outfile: outputFile
	};

	if (typeof esbuildConfigPath === 'string') {
		esbuildConfigPath = resolveRelativePath(esbuildConfigPath);
		if (fileExists(esbuildConfigPath)) {
			const config = (await importESM(esbuildConfigPath)).default as EsbuildOptions;
			esbuildConfig = {
				...config,
				...esbuildConfig
			};
			// want to use stdin and not configs entry point so remove it
			if (typeof esbuildConfig.entryPoints !== 'undefined') delete esbuildConfig.entryPoints;
		}
	}

	if (sourcemaps) {
		esbuildConfig.sourcemap = 'inline';
		const sourceMapSupport = esbuildConfig.format?.toLowerCase() === 'esm'
			? `import '@rtvision/mocha-esbuild/node_modules/source-map-support/register.js';`
			: `require('@rtvision/mocha-esbuild/node_modules/source-map-support').install();`;
		addJsBanner(esbuildConfig, sourceMapSupport);
	}

	addTopLevelRequire(esbuildConfig);

	if (esbuildConfig.format?.toLowerCase() !== 'esm') {
		esbuildConfig.outfile?.replace(/\.mjs$/, '.js');
	}

	if (watch) {
		esbuildConfig.watch = { onRebuild };
	}

	return Esbuild(esbuildConfig);
}
