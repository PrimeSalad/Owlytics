"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
require("express-async-errors");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const env_1 = require("./config/env");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_routes_1 = require("./routes/auth.routes");
const user_routes_1 = require("./routes/user.routes");
const student_routes_1 = require("./routes/student.routes");
const event_routes_1 = require("./routes/event.routes");
const attendance_routes_1 = require("./routes/attendance.routes");
const report_routes_1 = require("./routes/report.routes");
const app = (0, express_1.default)();
exports.app = app;
// ── Security ──────────────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: env_1.env.FRONTEND_URL, credentials: true }));
// ── Parsing ───────────────────────────────────────────
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// ── Logging ───────────────────────────────────────────
if (env_1.env.NODE_ENV !== 'test')
    app.use((0, morgan_1.default)('dev'));
// ── Routes ────────────────────────────────────────────
app.use('/api/auth', auth_routes_1.authRouter);
app.use('/api/users', user_routes_1.userRouter);
app.use('/api/students', student_routes_1.studentRouter);
app.use('/api/events', event_routes_1.eventRouter);
app.use('/api/attendance', attendance_routes_1.attendanceRouter);
app.use('/api/reports', report_routes_1.reportRouter);
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
// ── Error handler (must be last) ──────────────────────
app.use(errorHandler_1.errorHandler);
