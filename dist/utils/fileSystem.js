"use strict";
/**
 * File system utilities for Conductor
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRACKS_FILE = exports.CONDUCTOR_DIR = void 0;
exports.resolveConductorDir = resolveConductorDir;
exports.ensureDir = ensureDir;
exports.fileExists = fileExists;
exports.readFile = readFile;
exports.writeFile = writeFile;
exports.readJsonFile = readJsonFile;
exports.writeJsonFile = writeJsonFile;
exports.listFiles = listFiles;
exports.listDirectories = listDirectories;
exports.execCommand = execCommand;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
exports.CONDUCTOR_DIR = 'conductor';
exports.TRACKS_FILE = 'index.md';
function resolveConductorDir(startPath) {
    let currentPath = startPath;
    while (currentPath !== path.parse(currentPath).root) {
        const conductorPath = path.join(currentPath, 'conductor');
        if (fs.existsSync(conductorPath) && fs.statSync(conductorPath).isDirectory()) {
            return conductorPath;
        }
        currentPath = path.dirname(currentPath);
    }
    // Final check at root
    const rootConductor = path.join(currentPath, 'conductor');
    if (fs.existsSync(rootConductor) && fs.statSync(rootConductor).isDirectory()) {
        return rootConductor;
    }
    return path.join(startPath, 'conductor'); // Default fallback
}
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}
function fileExists(filePath) {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}
function readFile(filePath) {
    try {
        if (!fileExists(filePath)) {
            return null;
        }
        return fs.readFileSync(filePath, 'utf-8');
    }
    catch {
        return null;
    }
}
function writeFile(filePath, content) {
    try {
        ensureDir(path.dirname(filePath));
        // Sanitize: Remove NULL bytes and trim to prevent 'Binary File' corruption
        const cleanContent = content.replace(/\0/g, '').trim();
        fs.writeFileSync(filePath, cleanContent, 'utf-8');
    }
    catch (error) {
        console.error(`Error writing to file ${filePath}: ${error}`);
    }
}
function readJsonFile(filePath) {
    const content = readFile(filePath);
    if (!content) {
        return null;
    }
    try {
        return JSON.parse(content);
    }
    catch {
        return null;
    }
}
function writeJsonFile(filePath, data) {
    writeFile(filePath, JSON.stringify(data, null, 2));
}
function listFiles(dirPath, extension) {
    if (!fs.existsSync(dirPath)) {
        return [];
    }
    const files = fs.readdirSync(dirPath);
    if (extension) {
        return files.filter((f) => f.endsWith(extension));
    }
    return files;
}
function listDirectories(dirPath) {
    if (!fs.existsSync(dirPath)) {
        return [];
    }
    return fs.readdirSync(dirPath)
        .filter((f) => fs.statSync(path.join(dirPath, f)).isDirectory());
}
function execCommand(command, cwd) {
    try {
        return (0, child_process_1.execSync)(command, { cwd, encoding: 'utf-8', stdio: 'pipe' });
    }
    catch {
        return null;
    }
}
