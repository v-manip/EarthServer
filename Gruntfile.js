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
				// src: ['js/SceneManager.js', 'js/*.js', 'js/VMANIP/*.js', '!js/EarthServerClient*.js', '!js/UI_v1.js'],
				// dest: 'js/<%= pkg.name %>_DailyBuild.js'
				files: {
					'js/RectangularBoxViewer.debug.js': ['js/RBV/*.js'],
					'js/<%= pkg.name %>_DailyBuild.js': ['js/SceneManager.js', 'js/*.js', '!js/RectangularBoxViewer*.js', '!js/EarthServerClient*.js', '!js/UI_v1.js'],
				}
			}
		},
		copy: {
			main: {
				// src: '<%= concat.dist.dest %>',
				// dest: '<%= installdir %>'
				files: [
					{
						src: ['js/RectangularBoxViewer.debug.js'],
						dest: '<%= installdir %>'
					},
					{
						src: ['js/<%= pkg.name %>_DailyBuild.js'],
						dest: '<%= installdir %>'
					},
				]
			},
		},
	});

	grunt.registerTask('default', ['concat', 'copy']);
};