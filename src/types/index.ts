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
	sourcemaps?: boolean,
	esbuildConfigPath?: string,
	onRebuild?: EsbuildWatchMode['onRebuild']
}
