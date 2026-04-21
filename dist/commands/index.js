"use strict";
/**
 * Command registry and exports
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSkillCommand = exports.archiveCommand = exports.revertCommand = exports.reviewCommand = exports.newTrackCommand = exports.statusCommand = exports.implementCommand = exports.setupCommand = void 0;
var setup_1 = require("./setup");
Object.defineProperty(exports, "setupCommand", { enumerable: true, get: function () { return setup_1.setupCommand; } });
var implement_1 = require("./implement");
Object.defineProperty(exports, "implementCommand", { enumerable: true, get: function () { return implement_1.implementCommand; } });
var status_1 = require("./status");
Object.defineProperty(exports, "statusCommand", { enumerable: true, get: function () { return status_1.statusCommand; } });
var newTrack_1 = require("./newTrack");
Object.defineProperty(exports, "newTrackCommand", { enumerable: true, get: function () { return newTrack_1.newTrackCommand; } });
var review_1 = require("./review");
Object.defineProperty(exports, "reviewCommand", { enumerable: true, get: function () { return review_1.reviewCommand; } });
var revert_1 = require("./revert");
Object.defineProperty(exports, "revertCommand", { enumerable: true, get: function () { return revert_1.revertCommand; } });
var archive_1 = require("./archive");
Object.defineProperty(exports, "archiveCommand", { enumerable: true, get: function () { return archive_1.archiveCommand; } });
var registerSkill_1 = require("./registerSkill");
Object.defineProperty(exports, "registerSkillCommand", { enumerable: true, get: function () { return registerSkill_1.registerSkillCommand; } });
