var gulp = require('gulp')
var path = require('path')
var fs = require('fs')
var gulp = require('gulp')
var pug = require('gulp-pug')
var sass = require('gulp-sass')
var babel = require('gulp-babel')
var prefix = require('gulp-autoprefixer')
var readLine = require('readline-sync')
var gutil = require('gulp-util')
var data = require('gulp-data')

gulp.task('new', function() {
   var projectName = readLine.question('Project Title: ')
   var projectPath = path.join(__dirname, 'projects', projectName)
   if(!fs.existsSync(projectPath)) {
      console.log('Creating project..')
      return gulp.src('template/**/*')
         .pipe(gulp.dest(projectPath));
   }

   console.log('Project Exists!')
});

gulp.task('watch', function() {
   gulp.watch([
      'projects/**/src/*', 'template/**/src/*', 'www/**/src/*',
      'projects/**/index.pug', 'template/index.pug', 'www/index.pug'], ['default'])
})

gulp.task('default', function() {
   var projectFolders = GulpFolders('projects')
   updateWWWJSON(projectFolders)

   GulpInception(projectFolders, microBuild)
   microBuild('template')
   microBuild('www')
})

function updateWWWJSON(projectFolders) {
   var wwwJSON = JSON.parse(fs.readFileSync(path.join(__dirname, 'www.json')))
   wwwJSON.projectsList = projectFolders.map(function(folderPath) {
      return { title: path.basename(folderPath), path: '../' + folderPath }
   })
   fs.writeFileSync(path.join(__dirname, 'www.json'), JSON.stringify(wwwJSON, null, '\t'))
}

function microBuild(pathSite) {
   console.log('Building: ' + pathSite)
   var pathDev = path.join(pathSite, 'src')
   var pathDist = path.join(pathSite, 'bin')

   // JS
   gulp.src(path.join(pathDev, '*.js'))
      .pipe(babel({ presets: ['env'] }).on('error', gutil.log))
      .pipe(gulp.dest(pathDist))

   // CSS
   gulp.src(path.join(pathDev, '*.scss'))
    .pipe(sass().on('error', gutil.log))
    .pipe(prefix({ browsers: ['last 2 versions'], cascade: false }).on('error', gutil.log))
    .pipe(gulp.dest(pathDist))

   // HTML
   gulp.src(path.join(pathDev, '*.pug'))
      .pipe(gulp.dest(pathDist))
   gulp.src(path.join(pathSite, 'index.pug'))
      .pipe(data(function(file) {
         return JSON.parse(fs.readFileSync(path.join(__dirname, 'www.json')));
      }))
      .pipe(pug({ pretty: true }).on('error', gutil.log))
      .pipe(gulp.dest(pathSite))
}

// Might work. Wish we just knew how gulp worked
function GulpInception(arrPaths, callBack) {
   for(var pathSite of arrPaths) {
      callBack(pathSite)
   }
}

function GulpFolders(pathFolders, absolute) {
   var arrFolders = []
   //var pathFolders = absolute ? pathFolders : path.join(__dirname, pathFolders)
   var pathFolders = pathFolders
   for(var fileName of fs.readdirSync(pathFolders)) {
      var pathFolder = path.join(pathFolders, fileName)
      if(fs.statSync(pathFolder).isDirectory()) {
         arrFolders.push(pathFolder)
      }
   }
   return arrFolders
}