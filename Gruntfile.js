module.exports = function(grunt) {
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-copy');

	grunt.initConfig({
		// Installation directory based on the V-MANIP organization repository:
		installdir: '../RectangularBoxViewer/deps/',
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			options: {
				separator: '\n'
			},
			dist: {
				files: {
					'dist/<%= pkg.name %>_DailyBuild.js': ['js/SceneManager.js', 'js/*.js', '!js/EarthServerClient*.js', '!js/UI_v1.js'],
				}
			}
		},
		copy: {
			main: {
				files: [
					{
						flatten: true,
						expand: true,
						src: ['dist/<%= pkg.name %>_DailyBuild.js'],
						dest: '<%= installdir %>'
					},
				]
			},
		},

		watch: {
            scripts: {
                files: ['js/*.js'],
                tasks: ['default']
            }
        }
	});

    grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['concat', 'copy']);
};
