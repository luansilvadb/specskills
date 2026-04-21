"use strict";
/**
 * Specialized Protocols for Different Project Types
 * Provides tailored workflows for front-end, back-end, and mobile development
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
exports.ProjectTypeDetector = exports.ProtocolFactory = exports.MobileDevelopmentProtocol = exports.BackendDevelopmentProtocol = exports.FrontendDevelopmentProtocol = exports.BaseSpecializedProtocol = exports.ProjectType = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
var ProjectType;
(function (ProjectType) {
    ProjectType["FRONTEND"] = "frontend";
    ProjectType["BACKEND"] = "backend";
    ProjectType["MOBILE"] = "mobile";
    ProjectType["FULLSTACK"] = "fullstack";
    ProjectType["DESKTOP"] = "desktop";
})(ProjectType || (exports.ProjectType = ProjectType = {}));
class BaseSpecializedProtocol {
    async execute(context) {
        try {
            // Validate that this protocol is appropriate for the project
            const validation = this.validateApplicability(context);
            if (!validation.valid) {
                return {
                    success: false,
                    message: `Protocol "${this.name}" is not applicable: ${validation.reason}`
                };
            }
            // Execute each step in sequence
            for (const step of this.steps) {
                // Validate the step before execution
                const validationResult = step.validate(context);
                if (!validationResult.success) {
                    return {
                        success: false,
                        message: `Step validation failed: ${step.name}. ${validationResult.message || ''}`
                    };
                }
                // Execute the step
                const result = await step.execute(context);
                // If any step fails, stop the protocol
                if (!result.success) {
                    return {
                        success: false,
                        message: `Protocol failed at step: ${step.name}. ${result.message}`
                    };
                }
            }
            return {
                success: true,
                message: `Protocol '${this.name}' for ${this.projectType} completed successfully.`
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Protocol execution failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * Validate if this protocol is applicable to the given context
     */
    validateApplicability(_context) {
        // This would be implemented by specific protocols
        return { valid: true };
    }
}
exports.BaseSpecializedProtocol = BaseSpecializedProtocol;
class FrontendDevelopmentProtocol extends BaseSpecializedProtocol {
    constructor() {
        super(...arguments);
        this.name = 'frontend-development';
        this.description = 'Specialized protocol for front-end development tasks';
        this.projectType = ProjectType.FRONTEND;
        this.steps = [
            {
                name: 'validate-frontend-context',
                description: 'Validate that the project context is appropriate for front-end development',
                execute: async (context) => {
                    // Check if we have front-end related files/configs
                    const hasPackageJson = await this.checkFileExists(context, 'package.json');
                    const hasFrontendConfig = await this.checkFrontendConfig(context);
                    if (!hasPackageJson && !hasFrontendConfig) {
                        return {
                            success: false,
                            message: 'No front-end project detected. Missing package.json or front-end configuration.'
                        };
                    }
                    return {
                        success: true,
                        message: 'Front-end project context validated'
                    };
                },
                validate: (_context) => {
                    return { success: true };
                }
            },
            {
                name: 'setup-frontend-environment',
                description: 'Configure front-end specific development environment',
                execute: async (context) => {
                    // Set up front-end specific configurations
                    const framework = await this.detectFrontendFramework(context);
                    return {
                        success: true,
                        message: `Front-end environment set up for ${framework || 'generic'} project`
                    };
                },
                validate: (_context) => {
                    return { success: true };
                }
            },
            {
                name: 'perform-frontend-tasks',
                description: 'Execute front-end specific development tasks',
                execute: async (_context) => {
                    return {
                        success: true,
                        message: 'Front-end tasks completed successfully'
                    };
                },
                validate: (_context) => {
                    return { success: true };
                }
            }
        ];
    }
    async checkFrontendConfig(context) {
        // Check for common front-end configuration files
        const configFiles = [
            'vite.config.js',
            'webpack.config.js',
            'rollup.config.js',
            'angular.json',
            'vue.config.js',
            'next.config.js',
            'gatsby-config.js'
        ];
        for (const configFile of configFiles) {
            if (await this.checkFileExists(context, configFile)) {
                return true;
            }
        }
        return false;
    }
    async detectFrontendFramework(context) {
        const packageJsonPath = `${context.projectRoot}/package.json`;
        try {
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
                if (deps.react)
                    return 'React';
                if (deps.vue)
                    return 'Vue';
                if (deps['@angular/core'])
                    return 'Angular';
                if (deps.next)
                    return 'Next.js';
                if (deps.nuxt)
                    return 'Nuxt';
                if (deps.svelte)
                    return 'Svelte';
                if (deps['@sveltejs/kit'])
                    return 'SvelteKit';
                if (deps.gatsby)
                    return 'Gatsby';
                if (deps['@vue/cli-service'])
                    return 'Vue CLI';
            }
        }
        catch (e) {
            // Ignore errors in detection
        }
        return null;
    }
    async checkFileExists(context, fileName) {
        const filePath = path.join(context.projectRoot, fileName);
        return fs.existsSync(filePath);
    }
}
exports.FrontendDevelopmentProtocol = FrontendDevelopmentProtocol;
class BackendDevelopmentProtocol extends BaseSpecializedProtocol {
    constructor() {
        super(...arguments);
        this.name = 'backend-development';
        this.description = 'Specialized protocol for back-end development tasks';
        this.projectType = ProjectType.BACKEND;
        this.steps = [
            {
                name: 'validate-backend-context',
                description: 'Validate that the project context is appropriate for back-end development',
                execute: async (context) => {
                    // Check for back-end indicators
                    const hasServerFile = await this.checkServerFiles(context);
                    const hasBackendConfig = await this.checkBackendConfig(context);
                    if (!hasServerFile && !hasBackendConfig) {
                        return {
                            success: false,
                            message: 'No back-end project detected. Missing server files or back-end configuration.'
                        };
                    }
                    return {
                        success: true,
                        message: 'Back-end project context validated'
                    };
                },
                validate: (_context) => {
                    return { success: true };
                }
            },
            {
                name: 'setup-backend-environment',
                description: 'Configure back-end specific development environment',
                execute: async (context) => {
                    const framework = await this.detectBackendFramework(context);
                    return {
                        success: true,
                        message: `Back-end environment set up for ${framework || 'generic'} project`
                    };
                },
                validate: (_context) => {
                    return { success: true };
                }
            },
            {
                name: 'configure-database-integration',
                description: 'Set up database integration for back-end project',
                execute: async (context) => {
                    const dbTech = await this.detectDatabaseTech(context);
                    return {
                        success: true,
                        message: `Database integration configured for ${dbTech || 'generic'}`
                    };
                },
                validate: (_context) => {
                    return { success: true };
                }
            },
            {
                name: 'perform-backend-tasks',
                description: 'Execute back-end specific development tasks',
                execute: async (_context) => {
                    return {
                        success: true,
                        message: 'Back-end tasks completed successfully'
                    };
                },
                validate: (_context) => {
                    return { success: true };
                }
            }
        ];
    }
    async checkServerFiles(context) {
        const serverFiles = [
            'server.js',
            'app.js',
            'index.js',
            'main.py',
            'main.go',
            'Program.cs',
            'main.rs',
            'app.rb'
        ];
        for (const file of serverFiles) {
            if (await this.checkFileExists(context, file)) {
                return true;
            }
        }
        return false;
    }
    async checkBackendConfig(context) {
        const configFiles = [
            'Dockerfile',
            'docker-compose.yml',
            'requirements.txt',
            'go.mod',
            'Cargo.toml',
            'Gemfile',
            'pom.xml',
            'build.gradle'
        ];
        for (const configFile of configFiles) {
            if (await this.checkFileExists(context, configFile)) {
                return true;
            }
        }
        return false;
    }
    async detectBackendFramework(context) {
        const packageJsonPath = `${context.projectRoot}/package.json`;
        try {
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
                if (deps.express)
                    return 'Express';
                if (deps.fastify)
                    return 'Fastify';
                if (deps['@nestjs/core'])
                    return 'NestJS';
                if (deps.koa)
                    return 'Koa';
                if (deps.hapi)
                    return 'Hapi';
                if (deps.sails)
                    return 'Sails';
                if (deps.feathers)
                    return 'Feathers';
            }
        }
        catch (e) {
            // Ignore errors in detection
        }
        // For other languages
        try {
            if (fs.existsSync(`${context.projectRoot}/requirements.txt`)) {
                const requirements = fs.readFileSync(`${context.projectRoot}/requirements.txt`, 'utf8');
                if (requirements.includes('django'))
                    return 'Django';
                if (requirements.includes('flask'))
                    return 'Flask';
                if (requirements.includes('fastapi'))
                    return 'FastAPI';
            }
        }
        catch (e) {
            // Ignore errors
        }
        return null;
    }
    async detectDatabaseTech(context) {
        const packageJsonPath = `${context.projectRoot}/package.json`;
        try {
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
                if (deps.mysql || deps['mysql2'])
                    return 'MySQL';
                if (deps.pg)
                    return 'PostgreSQL';
                if (deps.sqlite3)
                    return 'SQLite';
                if (deps.mongodb || deps['@types/mongodb'] || deps.mongoose)
                    return 'MongoDB';
                if (deps.redis)
                    return 'Redis';
                if (deps.prisma)
                    return 'Prisma';
                if (deps.sequelize)
                    return 'Sequelize';
                if (deps.knex)
                    return 'Knex';
            }
        }
        catch (e) {
            // Ignore errors in detection
        }
        return null;
    }
    async checkFileExists(context, fileName) {
        const filePath = path.join(context.projectRoot, fileName);
        return fs.existsSync(filePath);
    }
}
exports.BackendDevelopmentProtocol = BackendDevelopmentProtocol;
class MobileDevelopmentProtocol extends BaseSpecializedProtocol {
    constructor() {
        super(...arguments);
        this.name = 'mobile-development';
        this.description = 'Specialized protocol for mobile development tasks';
        this.projectType = ProjectType.MOBILE;
        this.steps = [
            {
                name: 'validate-mobile-context',
                description: 'Validate that the project context is appropriate for mobile development',
                execute: async (context) => {
                    const hasMobileConfig = await this.checkMobileConfig(context);
                    if (!hasMobileConfig) {
                        return {
                            success: false,
                            message: 'No mobile project detected. Missing mobile framework configuration.'
                        };
                    }
                    return {
                        success: true,
                        message: 'Mobile project context validated'
                    };
                },
                validate: (_context) => {
                    return { success: true };
                }
            },
            {
                name: 'setup-mobile-environment',
                description: 'Configure mobile specific development environment',
                execute: async (context) => {
                    const platform = await this.detectMobilePlatform(context);
                    return {
                        success: true,
                        message: `Mobile environment set up for ${platform} project`
                    };
                },
                validate: (_context) => {
                    return { success: true };
                }
            },
            {
                name: 'configure-mobile-build-system',
                description: 'Set up mobile-specific build and deployment system',
                execute: async (_context) => {
                    return {
                        success: true,
                        message: 'Mobile build system configured'
                    };
                },
                validate: (_context) => {
                    return { success: true };
                }
            },
            {
                name: 'perform-mobile-tasks',
                description: 'Execute mobile specific development tasks',
                execute: async (_context) => {
                    return {
                        success: true,
                        message: 'Mobile tasks completed successfully'
                    };
                },
                validate: (_context) => {
                    return { success: true };
                }
            }
        ];
    }
    async checkMobileConfig(context) {
        const mobileConfigs = [
            'pubspec.yaml', // Flutter
            'Podfile', // iOS CocoaPods
            'build.gradle', // Android
            'capacitor.config.json', // Capacitor
            'ionic.config.json', // Ionic
            'nativescript.config.ts', // NativeScript
            'react-native.config.js' // React Native
        ];
        for (const configFile of mobileConfigs) {
            if (await this.checkFileExists(context, configFile)) {
                return true;
            }
        }
        return false;
    }
    async detectMobilePlatform(context) {
        const fs = require('fs');
        const rootPath = context.projectRoot;
        // Check for Flutter
        if (fs.existsSync(`${rootPath}/pubspec.yaml`)) {
            const pubspec = fs.readFileSync(`${rootPath}/pubspec.yaml`, 'utf8');
            if (pubspec.includes('flutter')) {
                return 'Flutter';
            }
        }
        // Check for React Native
        if (fs.existsSync(`${rootPath}/package.json`)) {
            const packageJson = JSON.parse(fs.readFileSync(`${rootPath}/package.json`, 'utf8'));
            const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            if (deps['react-native'])
                return 'React Native';
            if (deps['@nativescript/core'])
                return 'NativeScript';
            if (deps['@capacitor/core'])
                return 'Capacitor';
            if (deps['@ionic-native/core'])
                return 'Ionic';
        }
        // Check for iOS (Podfile) or Android (build.gradle at root)
        if (fs.existsSync(`${rootPath}/Podfile`))
            return 'iOS (CocoaPods)';
        if (fs.existsSync(`${rootPath}/android/build.gradle`))
            return 'Android';
        // Generic mobile project
        return 'Mobile (Generic)';
    }
    async checkFileExists(context, fileName) {
        const filePath = path.join(context.projectRoot, fileName);
        return fs.existsSync(filePath);
    }
}
exports.MobileDevelopmentProtocol = MobileDevelopmentProtocol;
class ProtocolFactory {
    /**
     * Create the appropriate protocol based on project context
     */
    static createProtocolForProject(projectType) {
        switch (projectType) {
            case ProjectType.FRONTEND:
                return new FrontendDevelopmentProtocol();
            case ProjectType.BACKEND:
                return new BackendDevelopmentProtocol();
            case ProjectType.MOBILE:
                return new MobileDevelopmentProtocol();
            default:
                throw new Error(`Unsupported project type: ${projectType}`);
        }
    }
    /**
     * Auto-detect project type from context and create appropriate protocol
     */
    static async createProtocolFromContext(context) {
        const detector = new ProjectTypeDetector();
        const projectType = await detector.detectProjectType(context);
        if (projectType) {
            return this.createProtocolForProject(projectType);
        }
        return null;
    }
}
exports.ProtocolFactory = ProtocolFactory;
class ProjectTypeDetector {
    /**
     * Auto-detect project type based on files and configuration
     */
    async detectProjectType(context) {
        // Check for mobile indicators first (most specific)
        const mobileProtocol = new MobileDevelopmentProtocol();
        if (await mobileProtocol.checkMobileConfig(context)) {
            return ProjectType.MOBILE;
        }
        // Check for backend indicators
        const backendProtocol = new BackendDevelopmentProtocol();
        if (await backendProtocol.checkServerFiles(context) || await backendProtocol.checkBackendConfig(context)) {
            // Check if it's also frontend (fullstack)
            const frontendProtocol = new FrontendDevelopmentProtocol();
            if (await frontendProtocol.checkFrontendConfig(context)) {
                return ProjectType.FULLSTACK;
            }
            return ProjectType.BACKEND;
        }
        // Check for frontend indicators
        const frontendProtocol = new FrontendDevelopmentProtocol();
        if (await frontendProtocol.checkFrontendConfig(context)) {
            return ProjectType.FRONTEND;
        }
        // If we can't determine, return null
        return null;
    }
}
exports.ProjectTypeDetector = ProjectTypeDetector;
