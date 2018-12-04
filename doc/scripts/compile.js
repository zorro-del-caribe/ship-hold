const pug = require('pug');
const fs = require('fs');

const parts = [
    {
        pugFile: './doc/introduction/index.pug',
        title: 'Introduction'
    },
    {
        pugFile: './doc/builders/index.pug',
        title: 'Builders'
    },
    {
        pugFile: './doc/builders/insert/index.pug',
        title: 'Insert Builder'
    },
    {
        pugFile: './doc/builders/update/index.pug',
        title: 'Update Builder'
    },
    {
        pugFile: './doc/builders/delete/index.pug',
        title: 'Delete Builder'
    },
    {
        pugFile: './doc/builders/select/index.pug',
        title: 'Select Builder'
    }
];

for (const p of parts) {
    const {pugFile, ...rest} = p;
    const [pugName, ...whatever] = pugFile.split('/').reverse();
    const [name] = pugName.split('.');
    const outputFile = whatever.reverse().concat(`${name}.html`).join('/');
    fs.writeFile(outputFile, pug.renderFile(pugFile, rest), () => {
        console.log(`${pugFile} done !`);
    });
}

