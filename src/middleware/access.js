const User = require("../models/User");

exports.grantAccess = (allowedRoles) => {
    return async (req, res, next) => {
        try{
            role = req.user.role
            if(allowedRoles.includes(role)){
                next();
            }else{
                res.status(401).json({msg: 'You do not have enough permission to perform this action'});
            }
        }catch(err){
            res.status(500).send('Something went wrong!');
        }
    }
}

exports.switchRoutebyRole = (role) => {
    return (req, res, next) => {
        if (req.user.role === role) {
            next()
        }else{
            next('route');
        }
    }
}
