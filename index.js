#!/usr/bin/env node
const { program } = require('commander');
const open = require('open');
const express = require('express')
const app = express()
const port = 8989
const fs = require("fs");
const path = require("path");
const uuid = require("uuid");
const v5 = uuid.v5;
const namespace = uuid.v4();
const glob = require("glob");

const IMAGE = [".png", ".jpg", ".bmp", ".gif"]
const VIDEO = [".mp4", ".webm"]
const exts = IMAGE.concat(VIDEO);
let association = {};

program.version('0.0.1');
program
    .option('-x', 'eXtended (use GLOB)')
    .option('-s', 'shuffle')
program.parse(process.argv);
const options = program.opts();
app.use(express.static(path.join(path.dirname(require.main.filename), "static")));
/*
app.get('/files', (req, res) => {
    let files = fs.readdirSync(".");
    let ret = [];
    for (const file of files) {
        if(exts.includes(path.extname(file)))
            ret.push(file);
    }

    res.json(ret)
})
 */
async function globA(globI, opt) {
    return await new Promise((res, rej) => {
        glob(globI, opt, (e, match) => {
            if(e) {
                rej()
                return;
            }
            res(match)
        })
    })
}

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}


app.get('/files', async (req, res) => {
    let files = fs.readdirSync(".");
    if(options.x)
        files = await globA("**/*", {})
    if(options.s)
        shuffle(files)
    let ret = [];
    for (const file of files) {
        let ext = path.extname(file.toLowerCase());
        if(exts.includes(ext)) {
            let code = v5(path.join(process.cwd(), file), namespace);
            association[code] = path.join(process.cwd(), file);
            ret.push({
                code,
                name: file,
                type: VIDEO.includes(ext) ? "video" : "image"
            });
        }
    }

    res.json(ret)
})
app.get('/file/:id', (req, res) => {
    res.set('Cache-Control', 'no-store')
    let file = req.params["id"];
    let truefile = association[file];
    if(truefile) {
        res.sendFile(truefile);
        return;
    }
    res.end();
});


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
    open(`http://localhost:${port}`)
})
