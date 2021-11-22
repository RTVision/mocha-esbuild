import { MochaOptions } from 'mocha';
import { WatchMode as EsbuildWatchMode } from 'esbuild';

export interface CustomMochaOptions extends Omit<MochaOptions, 'require'> {
	require?: string
}

export interface RunMochaOptions {
	mochaOptions?: CustomMochaOptions | null;
	isWorker?: boolean;
	mochaConfigPath?: string | null;
}

export interface EsbuildFlags {
	watch?: boolean,
	sourcemap?: boolean,
	importSourceMapSupport: boolean,
	esbuildConfigPath?: string,
	onRebuild?: EsbuildWatchMode['onRebuild']
}
