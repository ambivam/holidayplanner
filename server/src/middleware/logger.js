// Request logging middleware
const logRequest = (req, res, next) => {
  console.log('Incoming request:', {
    method: req.method,
    path: req.path,
    params: req.params,
    body: req.body,
    headers: req.headers
  });
  next();
};

module.exports = logRequest;
