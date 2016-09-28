
'use strict';
module.exports = function (grunt) {
	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
	
	var yeomanConfig = {
		root: '',
		dist: 'dist'
	};
	grunt.initConfig({
		config: yeomanConfig,
		clean: {
			dist: {
				src: [ '<%= config.dist %>' ]
			}
		},
	  	copy: {
			main: {
				cwd: '',
				src: [ 
					'index.html',
					'favicon.ico',
					'css/*.*',
					'js/*.*'
				],
				dest: '<%= config.dist %>',
				expand: true
			},
			changeVersionInIndexHtml: {
				cwd: '<%= config.dist %>',
				src: ['index.html'],
				dest: '<%= config.dist %>',
				expand: true,
				options: {
					process: function (content, srcpath) {
						var ver = (Date.now() / 1000 | 0);
						console.log("version replaced with ", ver);
						return content.replace("css/pay-through-indifi.css", "css/pay-through-indifi.css?v=" + ver).replace("js/pay-through-indifi.js", "js/pay-through-indifi.js?v=" + ver).replace("config/environments/default.js", "config/environments/default.js?v=" + ver);
					}
				}
			},
			prod: {
				cwd: '.',
				src: ['config/environments/production.js'],
				dest: '<%= config.dist %>',
				expand: true,
				rename : function (dest, src) {
					return dest +  "/" + src.substring(0, src.lastIndexOf("/"))+"/default.js";
				}
			},
			stage: {
				cwd: '.',
				src: ['config/environments/staging.js'],
				dest: '<%= config.dist %>',
				expand: true,
				rename : function (dest, src) {
					return dest +  "/" + src.substring(0, src.lastIndexOf("/"))+"/default.js";
				}
			},
			demo: {
				cwd: '.',
				src: ['config/environments/demo.js'],
				dest: '<%= config.dist %>',
				expand: true,
				rename : function (dest, src) {
					return dest +  "/" + src.substring(0, src.lastIndexOf("/"))+"/default.js";
				}
			},
			local: {
				cwd: '.',
				src: ['config/environments/default.js'],
				dest: '<%= config.dist %>',
				expand: true
			}
		},
		uglify: {
			options :{
				sourceMap : false,
				preserveComments: false
			},
			dist: {
				files: {
					'<%= config.dist %>/js/pay-through-indifi.js': ['<%= config.dist %>/js/pay-through-indifi.js']
				}
			}
		},
		cssmin: {
			dist: {
				files: [{
					expand: true,
					cwd: '<%= config.dist %>/css',
					src: ['*.css'],
					dest: '<%= config.dist %>/css'
				}]
			}
		}
	});
	grunt.registerTask('build', 'Pay Through Indifi web app build task', function(){
		grunt.task.run([
			'clean:dist',
			'copy:main',
			'copy:changeVersionInIndexHtml',
			'uglify',
			'cssmin'
		]);
		if(this.args.length > 0){
			grunt.task.run('copy:' + this.args[0]);
		} else {
			grunt.task.run('copy:local');
		}
	});
	grunt.registerTask('default', ['build']);
};