#!/usr/bin/env node
'use strict';
var _ = require('lodash');
var path = require('path');
var api = require('./api');
var context = require('./context');
var shell = require('./shell');
var pkg = require('../package.json');
var options = require('./options');
var reactDOMSupport = require('./reactDOMSupport');
var reactTemplates = require('./reactTemplates');
var rtStyle = require('./rtStyle');

/**
 * @param {Options} currentOptions
 * @return {number}
 */
function executeOptions(currentOptions) {
    var ret = 0;
    var files = currentOptions._;
    context.options.format = currentOptions.format || 'stylish';

    if (currentOptions.version) {
        console.log(`v${pkg.version}`);
    } else if (currentOptions.help) {
        if (files.length) {
            console.log(options.generateHelpForOption(files[0]));
        } else {
            console.log(options.generateHelp());
        }
    } else if (currentOptions.listTargetVersion) {
        printVersions(currentOptions);
    } else if (files.length) {
        _.forEach(files, handleSingleFile.bind(this, currentOptions));
        ret = shell.printResults(context);
    } else {
        console.log(options.generateHelp());
    }
    return ret;
}

function printVersions(currentOptions) {
    var ret = Object.keys(reactDOMSupport);
    //const out = currentOptions.format === 'json' ? JSON.stringify(ret, undefined, 2) : ret.join(', ');
    //console.log(out);
    if (currentOptions.format === 'json') {
        console.log(JSON.stringify(ret, undefined, 2));
    } else {
        console.log(ret.join(', '));
    }
}

/**
 * @param {Options} currentOptions
 * @param {string} filename file name to process
 */
function handleSingleFile(currentOptions, filename) {
    try {
        var sourceExt = path.extname(filename);
        var outputFilename;
        if (sourceExt === '.rt') {
            outputFilename = filename + (currentOptions.modules === 'typescript' ? '.ts' : '.js');
        } else if (sourceExt === '.jsrt') {
            outputFilename = filename.replace(/\.jsrt$/, '.js');
            currentOptions = _.assign({}, currentOptions, {modules: 'jsrt'});
        } else if (sourceExt === '.rts') {
            outputFilename = filename + '.js';
            currentOptions = _.assign({}, currentOptions, {modules: 'rts'});
        } else {
            context.error('invalid file, only handle rt/jsrt files', filename);
            return;
        }
        api.convertFile(filename, outputFilename, currentOptions, context);
    } catch (e) {
        context.error(e.message, filename, e.line, e.column, e.startOffset, e.endOffset);
    }
}

/**
 * Executes the CLI based on an array of arguments that is passed in.
 * @param {string|Array|Object} args The arguments to process.
 * @returns {int} The exit code for the operation.
 */
function execute(args) {
    var currentOptions;
    try {
        currentOptions = options.parse(args);
    } catch (error) {
        console.error(error.message);
        return 1;
    }
    return executeOptions(currentOptions);
}

module.exports = {
    context: context,
    execute: execute,
    executeOptions: executeOptions,
    handleSingleFile: handleSingleFile,
    convertTemplateToReact: reactTemplates.convertTemplateToReact,
    convertStyle: rtStyle.convert
};
