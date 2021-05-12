const fs = require('fs');
const path = require('path');
const folder = path.join('.', 'build')
const default_cname = new URL(require(path.join('..', 'package.json'))['homepage']).hostname

function CreateCname() {
    let cname = default_cname
    if (process.env.hasOwnProperty('AC_CNAME') && process.env.AC_CNAME.length > 0) {
        cname = process.env.AC_CNAME
    }

    fs.writeFile(path.join(folder, 'CNAME'), cname, {flag: 'w'}, function (err) {
        if (err !== null) {
            console.log(err)
        }
    })
}

(function (){
    CreateCname()
})()


