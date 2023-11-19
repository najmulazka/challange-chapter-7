require('dotenv').config();
const express = require('express');
const app = express();
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const Sentry = require('@sentry/node');
const router = require('./routes/index.routes');
const { PORT, SENTRY_DSN } = process.env;
const path = require('path');

Sentry.init({
  dsn: SENTRY_DSN,
  integrations: [new Sentry.Integrations.Http({ tracing: true }), new Sentry.Integrations.Express({ app })],
  tracesSampleRate: 1.0,
});

app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// flash config
app.use(cookieParser('secret'));
app.use(
  session({
    cookie: { maxAge: 6000 },
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
  })
);
app.use(flash());

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

//config websocket
const server = require('http').createServer(app);
const io = require('socket.io')(server);
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api/v1', router);

app.use(Sentry.Handlers.errorHandler());

app.use((req, res) => {
  res.status(404).json({
    status: false,
    message: 'Not Found',
    err: null,
    data: null,
  });
});

app.use((err, req, res, next) => {
  res.status(500).json({
    status: false,
    message: 'Internal Server Error',
    err: err.message,
    data: null,
  });
});

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
