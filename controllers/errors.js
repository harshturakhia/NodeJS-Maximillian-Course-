module.exports.get404 = (req, res, next) => {
    res.status(404).render('404', { pageTitle: 'Page Not Found', path: '', isAuthenticated: req.session.isLoggedIn });
};

module.exports.get500 = (req, res, next) => {
    res.status(500).render('500', { pageTitle: 'Page Not Found', path: '', isAuthenticated: req.session.isLoggedIn });
};