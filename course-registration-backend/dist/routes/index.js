"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_1 = require("../controllers/chat.controller");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const portal_controller_1 = require("../controllers/portal.controller");
const router = (0, express_1.Router)();
// check health
router.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'AI course registration Backend is running' });
});
router.post('/login', auth_controller_1.login);
router.post('/chat', auth_middleware_1.verifyToken, chat_controller_1.handleChat);
router.get('/portal/timetable', auth_middleware_1.verifyToken, portal_controller_1.getMyTimetable);
router.get('/portal/course-structure', auth_middleware_1.verifyToken, portal_controller_1.getCourseStructure);
router.get('/portal/courses/search', auth_middleware_1.verifyToken, portal_controller_1.searchCoursesApi);
router.get('/portal/dashboard-intel', auth_middleware_1.verifyToken, portal_controller_1.getDashboardIntel);
router.post('/portal/register', auth_middleware_1.verifyToken, portal_controller_1.manualRegisterApi);
router.post('/portal/course/drop', auth_middleware_1.verifyToken, portal_controller_1.manualDropApi);
exports.default = router;
