module.exports = function(grunt) {
	grunt.loadNpmTasks('grunt-contrib-concat');

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			options: {
				separator: '\n'
			},
			dist: {
				src: ['js/SceneManager.js', 'js/*.js', '!js/EarthServerClient*.js', '!js/UI_v1.js'],
				dest: 'dist/<%= pkg.name %>.js'
			}
		}
	});

	grunt.registerTask('default', ['concat']);
};