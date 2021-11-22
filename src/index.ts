import { Command, flags } from '@oclif/command';
import { tmpName } from 'tmp-promise';
import Chalk from 'chalk';
import { CustomMochaOptions, EsbuildFlags } from './types';
import { runMocha, cleanUp, initWorker } from './Helpers';
import EsbuildRunner from './Esbuild';

const mochaFlags = {
	bail: flags.boolean({
		char: 'b',
		description: 'Bail on the first test failure.',
		default: false
	}),
	color: flags.boolean({
		char: 'c',
		description: 'Color TTY output from reporter.',
		default: false
	}),
	fgrep: flags.string({
		description: 'Test filter given string'
	}),
	fullTrace: flags.string({
		description: 'Full stacktrace upon failure?'
	}),
	grep: flags.string({
		char: 'g',
		description: 'Test filter given regular expression.'
	}),
	invert: flags.boolean({
		description: 'Invert test filter matches?',
		default: false
	}),
	timeout: flags.string({
		char: 't',
		description: 'Timeout threshold value for mocha.'
	}),
	require: flags.string({
		char: 'r',
		description: 'Pathname of file that will be imported before tests run'
	}),
	reporter: flags.string({
		description: 'Reporter name to use'
	}),
	retries: flags.integer({
		description: 'Number of times to retry failed tests'
	}),
	parallel: flags.boolean({
		char: 'p',
		description: 'Run test in parallel.',
		default: false
	}),
	jobs: flags.integer({
		description: 'Max number of worker processes for parallel runs',
		dependsOn: ['parallel']
	})
};

class MochaEsbuild extends Command {
	static description = 'Run tests with mocha compiled by esbuild';

	static flags = {
		version: flags.version({ char: 'v' }),
		help: flags.help({ char: 'h' }),
		esbuildConfig: flags.string({
			default: '.esbuildrc.js',
			description: 'Esbuild config file path. The follow options will always be overwritten: bundle, stdin/entryPoints, and outfile'
		}),
		mochaConfigPath: flags.string({
			description: 'Filepath to read mocha configs from, can be js or json file'
		}),
		watch: flags.boolean({
			char: 'w',
			default: false,
			description: 'Enable watch mode for esbuild. Will overwrite watch if custom config provided'
		}),
		sourcemap: flags.boolean({
			char: 's',
			default: false,
			description: 'Generates inline sourcemaps for easier debugging. Will overwrite sourcemaps if custom config provided'
		}),
		noImportSourceMapSupport: flags.boolean({
			default: false,
			description: 'Disable the importing source-map-support package when sourcemap enabled',
			dependsOn: ['sourcemap']
		}),
		...mochaFlags
	};

	static args = [{
		name: 'file',
		default: 'test/unit/**/*.spec.js',
		description: 'File path to the entry point to build from. Can be 1 specific file or take a globstar such as \'test/unit/**/*.spec.js\''
	}];

	async run () {
		const { args, flags } = this.parse(MochaEsbuild);

		let mochaOptions : CustomMochaOptions | null = {};

		for (const mochaFlag in mochaFlags) {
			const flagValue = flags[mochaFlag as keyof typeof flags];
			if (flagValue) {
				mochaOptions[mochaFlag as keyof typeof mochaOptions] = flagValue;
			}
		}
		if (Object.keys(mochaOptions).length === 0) mochaOptions = null;

		const outputFile = `${await tmpName({ tmpdir: process.cwd(), prefix: '.temp-mocha-esbuild' })}.mjs`;

		process.on('SIGINT', async () => {
			await cleanUp(outputFile);
			process.exit();
		});

		const onRebuild : EsbuildFlags['onRebuild'] = error => {
			if (error) {
				console.error('watch build failed:', error);
			} else {
				console.clear();
				this.log(Chalk.green('Rebuild successful, starting tests'));
				initWorker(outputFile, { mochaOptions, mochaConfigPath: flags.mochaConfigPath });
			}
		};
		this.log(Chalk.cyan('Config processed, starting esbuild'));
		await EsbuildRunner(args.file, outputFile, {
			watch: flags.watch,
			sourcemap: flags.sourcemap,
			importSourceMapSupport: !flags.noImportSourceMapSupport,
			esbuildConfigPath: flags.esbuildConfig,
			onRebuild
		});

		this.log(Chalk.green('Build was successful, running tests'));
		if (flags.watch === false) {
			const failures = await runMocha(outputFile, { mochaOptions, mochaConfigPath: flags.mochaConfigPath });
			await cleanUp(outputFile);
			if (failures > 0) process.exit(1);
		} else {
			initWorker(outputFile, { mochaOptions, mochaConfigPath: flags.mochaConfigPath });
		}
	}
}

export = MochaEsbuild
