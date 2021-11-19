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
		/**
		 * Transforms all dynamic imports that contain a template literal varable and
		 * has an extension passed in by transformExtensions. I.E. import(`../../${file}.vue)
		 * will be turned into static imports of every possible valid import it could be. It then
		 * uses the static import reference in the file. Reason for this is we want esbuild
		 * to process the possible imports that are .vue (SFC vue) files so they can be
		 * processed by the EsbuildVue plugin and made into valid javascript that nodejs can run.
		 *
		 * Also with this plugin is that if there exists a dynamic import like I.E. import(`../../$file}.js`)
		 * that could be resolved at runtime just fine by nodejs, but the only issue is that the relative
		 * file path is now different due to the bundled file produced by esbuild being in likely differnt
		 * file location. changeRelativeToAbsolute will fix this issue by changing all relative imports to
		 * absolute ones. I will also note that the dynamic import in my project needs to be relative due
		 * to also using vite for production builds which uses rollup internally.
		 * Rollup requires all dynamic imports be relative, so I can't just use process.cwd() in the source code.
		 */
		DynamicImport({ transformExtensions: ['.vue'], changeRelativeToAbsolute: true }),
		// Current plugin is for Vue 2 SFC https://www.npmjs.com/package/esbuild-vue
		// for Vue 3 SFC https://www.npmjs.com/package/esbuild-plugin-vue3
		EsbuildVue(),
		// since we are running tests inde nodejs only include the packages that need
		// to be processed by esbuild for whatever reason. That way the bundled file
		// size can be decreased and defer to node at runtime to load the exclude packages
		// note including a package down below will likely pull in its dependencies also
		// For example vue-pdf was then pulling in pdfjs-dst work, I had to add that
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
