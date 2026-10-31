const roleMiddleware = (...allowRole) => {
    return (req, res, next) => {
        const userRole = req.user.role;
        if(!allowRole.includes(userRole) || !userRole) {
            return res.status(403).json({ message: 'Access denied' });
        }
        next();
    }
}
export default roleMiddleware;