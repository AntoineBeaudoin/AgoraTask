export const hasWritePosteRights = (req, res, next) => {
  if (!req.user) {
    const error = new Error("Utilisateur non authentifié.");
    error.statusCode = 401;
    return next(error);
  }

  if (!(req.user.role == "administrateur" || req.user.role == "coordonnateur")) {
    const error = new Error("Accès interdit : droits administrateur ou coordonnateur requis.");
    error.statusCode = 403;
    return next(error);
  }

  next();
};

export default hasWritePosteRights;