export default function auth(req, res, next) {
  var authHeader = req.headers.authorization;
  if (!authHeader) {
    var err = new Error("Unauthorized");

    res.setHeader("WWW-Authenticate", "Basic");
    err.status = 401;
    next(err);
  }

  var auth = new Buffer(authHeader.split(" ")[1], "base64")
    .toString()
    .split(":");
  var username = auth[0];
  var password = auth[1];

  if (username == "admin" && password == "nodejs_courses_api") {
    next();
  } else {
    var err = new Error("Unauthorized");

    res.setHeader("WWW-Authenticate", "Basic");
    err.status = 401;
    next(err);
  }
}
