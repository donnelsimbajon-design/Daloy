const fs = require('fs');
const path = require('path');

const dirsToScan = [
    path.join(__dirname, 'resources', 'js', 'Components'),
    path.join(__dirname, 'resources', 'js', 'Pages'),
    path.join(__dirname, 'resources', 'js', 'Layouts')
];

function walk(d, cb) {
    if(!fs.existsSync(d)) return;
    fs.readdirSync(d).forEach(f => {
        let p = path.join(d, f);
        fs.statSync(p).isDirectory() ? walk(p, cb) : cb(p);
    });
}

dirsToScan.forEach(dir => {
    walk(dir, f => {
        if(f.endsWith('.jsx')) {
            let c = fs.readFileSync(f, 'utf8');
            let n = c.replace(/className=([\"'\`])(.*?)\1/g, (m, q, classes) => {
                if(classes.includes('bg-biolum') && (classes.includes('text-white') || classes.includes('text-ocean-text'))) {
                    return m.replace(classes, classes.replace(/\btext-white\b/g, 'text-biolum-foreground')
                                                    .replace(/\btext-ocean-text\b/g, 'text-biolum-foreground'));
                }
                return m;
            });
            if(c !== n) {
                fs.writeFileSync(f, n);
                console.log('Fixed', f);
            }
        }
    });
});
