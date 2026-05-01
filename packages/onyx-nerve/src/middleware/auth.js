export const authMiddleware = async (c, next) => {
    const token = process.env.ONYX_NERVE_TOKEN;
    if (!token) {
        return next();
    }
    const authHeader = c.req.header("Authorization");
    if (authHeader !== `Bearer ${token}`) {
        return c.json({ error: "Unauthorized" }, 401);
    }
    return next();
};
