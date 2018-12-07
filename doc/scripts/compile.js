const pug = require('pug');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const targetRoot = './dist/doc';
const parts = [
    {
        pugFile: './doc/introduction/index.pug',
        title: 'Introduction',
        target: 'index.html'
    },
    {
        pugFile: './doc/builders/index.pug',
        title: 'Builders',
        target: 'builders/index.html'
    },
    {
        pugFile: './doc/builders/insert/index.pug',
        title: 'Insert Builder',
        target: 'builders/insert/index.html'
    },
    {
        pugFile: './doc/builders/update/index.pug',
        title: 'Update Builder',
        target: 'builders/update/index.html'
    },
    {
        pugFile: './doc/builders/delete/index.pug',
        title: 'Delete Builder',
        target: 'builders/delete/index.html'
    },
    {
        pugFile: './doc/builders/select/index.pug',
        title: 'Select Builder',
        target: 'builders/select/index.html'
    },
    {
        pugFile: './doc/builders/conditions/index.pug',
        title: 'Conditions Builder',
        target: 'builders/conditions/index.html'

    },
    {
        pugFile: './doc/run-queries/index.pug',
        title: 'Run queries',
        target: 'run-queries/index.html'
    },
    {
        pugFile: './doc/services/index.pug',
        title: 'Services',
        target: 'services/index.html'
    },
    {
        pugFile: './doc/performances/index.pug',
        title: 'Performances',
        target: 'performances/index.html'
    }
];

const directories = parts.map(({target}) => {
    const [filename, ...rest] = target.split('/').reverse();
    return rest.reverse().join('/');
});

for (const d of directories) {
    mkdirp.sync(path.resolve(targetRoot, d), {
        recursive: true
    });
}

for (const p of parts) {
    const {pugFile, target, ...rest} = p;
    const outputFile = path.resolve(targetRoot, target);
    fs.writeFile(outputFile, pug.renderFile(pugFile, rest), () => {
        console.log(`${pugFile} done > ${outputFile}`);
    });
}
