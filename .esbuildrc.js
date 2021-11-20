import EsbuildVue from 'esbuild-vue';
import { esbuildPluginNodeExternals } from 'esbuild-plugin-node-externals';
import DynamicImport from './esbuild-dynamic-import.js';

// Example working esbuild config I use in my companies codebase
// reference at https://esbuild.github.io/api/#build-api
export default {
	target: 'node16',
	format: 'esm',
	platform: 'node',
	mainFields: ['module', 'main', 'browser'],
	external: [
		'canvas',
		'worker-loader!pdfjs-dist/es5/build/pdf.worker.js',
		'pdfmake',
		'xlsx'
	],
	plugins: [
		// see https://github.com/RtVision/esbuild-dynamic-import
		DynamicImport({ transformExtensions: ['.vue'], changeRelativeToAbsolute: true }),
		// Current plugin is for Vue 2 SFC https://www.npmjs.com/package/esbuild-vue
		// for Vue 3 SFC https://www.npmjs.com/package/esbuild-plugin-vue3
		EsbuildVue(),
		// since we are running tests in nodejs only include the packages that need
		// to be processed by esbuild for whatever reason. That way the bundled file
		// size can be decreased and defer to node at runtime to load the exclude packages.
		// A note, including a package down below will likely pull in its dependencies also
		// For example vue-pdf was then pulling in pdfjs-dst worker, I had to add that
		// to the externals array above to explicitly disallow bundling that in
		esbuildPluginNodeExternals({
			include: [
				'bootstrap-vue',
				'vue-typeahead-bootstrap',
				'vue-pdf',
				'vue-datetime',
				'@amcharts/amcharts4',
				'rtvision-app-common',
				'ajv',
				'ol-layerswitcher',
				'@vue/composition-api',
				'ol',
				'@shopify/draggable'
			]
		})
	],
	define: {
		'process.env.NODE_ENV': JSON.stringify('development'),
		'process.env.TEST_ENV': JSON.stringify(true)
	}
}
