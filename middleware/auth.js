// ensure user is authenticated
exports.ensureauthenticated = (req, res, next) => {
  if (req.session.user) {
    req.user = req.session.user; // populate req.user
    return next();
  }
  res.redirect('/login');
}

// ensure user is attendant
exports.ensureAgent = (req, res, next) => {
  if (req.session.user && req.session.user.role === "attendant") {
    req.user = req.session.user; // populate req.user
    return next();
  }
  res.redirect('/');
}

// ensure user is manager
exports.ensureManager = (req, res, next) => {
  if (req.session.user && req.session.user.role === "manager") {
    req.user = req.session.user; // populate req.user
    return next();
  }
  res.redirect('/');
}
