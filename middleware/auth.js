// ensure user is authenticated
exports.ensureauthenticated = (req,res, next) =>{
    if (req.session .user){
       return next()
    }
    res.redirect('/login')
}

// ensure user is attendant
exports.ensureAgent = (req,res, next) =>{
    if (req.session .user && req.session.user.role==="attendant"){
       return next()
    }
    res.redirect('/')
}

// ensure user is manager
exports.ensureManager = (req,res, next) =>{
    if (req.session .user && req.session.user.role==="manager"){
       return next()
    }
    res.redirect('/')

}

