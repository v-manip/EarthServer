module.exports = function(grunt) {
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-copy');

	grunt.initConfig({
		// Installation directory based on the V-MANIP organization repository:
		installdir: '../WebClient-Framework/app/bower_components/rectangularboxviewer/',
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			options: {
				separator: '\n'
			},
			dist: {
				// FIXXME: Module_WMSDemWMS.js has to be manually included, for some reason...
				src: ['js/SceneManager.js', 'js/*.js', 'js/Module_WMSDemWMS.js', '!js/EarthServerClient*.js', '!js/UI_v1.js'],
				dest: 'js/<%= pkg.name %>_DailyBuild.js'
			}
		},
		copy: {
			main: {
				src: '<%= concat.dist.dest %>',
				dest: '<%= installdir %>'
			},
		},
	});

	grunt.registerTask('default', ['concat', 'copy']);
};