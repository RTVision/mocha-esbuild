import { extname as fileExtension, isAbsolute as pathIsAbsolute, resolve as pathResolve } from 'path';
import { promises as fsPromise, existsSync as fileExists } from 'fs';
import { Worker } from 'worker_threads';
import Mocha from 'mocha';
import { CustomMochaOptions, RunMochaOptions } from './types';

/**
 * From: https://github.com/webpack/webpack-cli/blob/0fa244b0/packages/webpack-cli/lib/utils/dynamic-import-loader.js
 *
 * We can't directly call "import" because TypeScript compiles it
 * https://github.com/microsoft/TypeScript/issues/43329
 */
export function importESM (specifier: string) {
	// eslint-disable-next-line no-new-func
	const indirectImport = new Function('id', 'return import(id);');
	return indirectImport(specifier);
}

let previousWorker: Worker | null = null;
export function initWorker (bundledFile : string, { mochaOptions, mochaConfigPath }: { mochaOptions?: CustomMochaOptions | null, mochaConfigPath?: string }) : void {
	const worker = new Worker(pathResolve(__dirname, './worker/MochaEsbuildWorker.js'), { workerData: { filename: bundledFile, mochaOptions, mochaConfigPath } });
	if (previousWorker !== null) previousWorker.terminate();
	previousWorker = worker;

	worker.once('message', () => {
		worker.terminate();
		runMocha(bundledFile, { isWorker: true });
	});

	worker.on('error', async error => {
		console.error(error);
	});
}

async function getMochaConfig (filePath: string | null = null) : Promise<CustomMochaOptions | null> {
	let usedFilePath = resolveRelativePath(filePath ?? '.mocharc.json');

	// esm modules are unable to import .json file types as of node16
	if (fileExtension(usedFilePath) === '.json' && fileExists(usedFilePath)) {
		return JSON.parse(await fsPromise.readFile(usedFilePath, 'utf-8'));
	} else if (filePath === null) {
		usedFilePath = resolveRelativePath('.mocharc.js');
	}

	if (!fileExists(usedFilePath)) return null;
	return (await import(usedFilePath)).default;
}

export async function runMocha (filename: string, { mochaOptions = null, isWorker = false, mochaConfigPath = null } : RunMochaOptions = {}) : Promise<number> {
	const fileMochaOptions = await getMochaConfig(mochaConfigPath) ?? {};
	mochaOptions = { ...fileMochaOptions, ...mochaOptions };
	if (isWorker) mochaOptions.isWorker = true;
	if (typeof mochaOptions.require === 'string') {
		let importFileName: string = mochaOptions.require;
		if (!mochaOptions.require.startsWith('.')) importFileName = `${process.cwd()}/${importFileName}`;
		if (fileExists(mochaOptions.require)) {
			await importESM(importFileName);
		}
		delete mochaOptions.require;
	}
	const mocha = new Mocha(mochaOptions as Mocha.MochaOptions);
	mocha.files = [filename];
	await mocha.loadFilesAsync();
	return new Promise(resolve => mocha.run(resolve));
}

export async function cleanUp (file : string) : Promise<void> {
	if (fileExists(file)) await fsPromise.unlink(file);
	const cssFile = file.replace('.mjs', '.css');
	if (fileExists(cssFile)) await fsPromise.unlink(cssFile);
}

export function resolveRelativePath (filePath : string) : string {
	if (!pathIsAbsolute(filePath)) return pathResolve(process.cwd(), filePath);
	return filePath;
}
