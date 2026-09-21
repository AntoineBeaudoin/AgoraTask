const isAdmin = (req, res, next) => {
  if (!req.user) {
    const error = new Error("Utilisateur non authentifié.");
    error.statusCode = 401;
    return next(error);
  }

  if (req.user.role !== "administrateur") {
    const error = new Error("Accès interdit : droits administrateur requis.");
    error.statusCode = 403;
    return next(error);
  }

  next();
};

export default isAdmin;
