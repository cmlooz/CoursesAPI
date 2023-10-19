import express, { request, response } from "express";
import basicAuth from "express-basic-auth";
import pg from "pg";

//Connecting to the database
const { Client } = pg;

import bodyParser from "body-parser";

import CoursesRequest from "./Wrappers/CoursesRequest.js";
import CoursesResponse from "./Wrappers/CoursesResponse.js";

const client = new Client({
  user: "postgres",
  //host: "localhost",
  host: "postgresql-server",
  database: "courses_db",
  password: "HDLCrin8*",
  port: 5432,
});

client.on("error", (err) => {
  console.error("Client error:", err.stack);
});

client.connect((err) => {
  if (err) {
    console.error("Connection error:", err.stack);
    //client.end();
  } else {
    console.log("Connected to PostgreSQL server");
  }
});

//Creating the needed tables

client.query(
  "CREATE TABLE IF NOT EXISTS courses (id SERIAL PRIMARY KEY, name VARCHAR(200) NOT NULL, description VARCHAR(1500) NOT NULL, startdate DATE NOT NULL, enddate DATE NOT NULL, createdon TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, createdby VARCHAR(50), ind_active SMALLINT DEFAULT 1 NOT NULL, modifiedon TIMESTAMP NULL, modifiedby VARCHAR(50) NULL);",
  (err_, res_) => {
    if (err_) {
      console.error(err_);
      return;
    }
    console.log("Table courses created");
  }
);

client.query(
  "CREATE TABLE IF NOT EXISTS classes (id SERIAL PRIMARY KEY, name VARCHAR(200) NOT NULL, description VARCHAR(1500) NOT NULL, content TEXT NOT NULL, startdate TIMESTAMP NOT NULL, createdon TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, createdby VARCHAR(50), ind_active SMALLINT DEFAULT 1 NOT NULL, modifiedon TIMESTAMP NULL, modifiedby VARCHAR(50) NULL, course_id INT NOT NULL, FOREIGN KEY (course_id) REFERENCES courses (id));",
  (err_, res_) => {
    if (err_) {
      console.error(err_);
      return;
    }
    console.log("Table classes created");
  }
);

//client.end();

//Creating the API
const app = express();

//const port = 8090;
const port = 80;

app.listen(port, () => {
  console.log("SERVER: http://localhost:" + port);
});

//To JSON Handle
app.use(bodyParser.json());

//For Auth
app.use(
  "/api",
  basicAuth({
    users: { admin: "Q2xhc3Nlcw==" },
  })
);

//CRUD For Courses

app.get("/api/Courses/GetAllCourses", (req, res) => {
  client.query("SELECT * FROM courses", (err_, res_) => {
    if (err_) {
      console.error(err_);
      return;
    }

    var response = new CoursesResponse(res_.rows, "", null);
    res.send(response);
  });
});

app.get("/api/Courses/GetCourse/:id", (req, res) => {
  const id = req.params.id;

  client.query("SELECT * FROM courses WHERE id = $1", [id], (err_, res_) => {
    if (err_) {
      console.error(err_);
      return;
    }

    var response = new CoursesResponse(res_.rows, "", null);
    res.send(response);
  });
});

app.post("/api/Courses/PostCourse", (request, res) => {
  const req = new CoursesRequest(
    request.body.process,
    request.body.action,
    request.body.data,
    request.body.parameters,
    request.body.user
  );

  console.log("req", req);

  const { name, description, startdate, enddate, user } = JSON.parse(req.data);

  client.query(
    "INSERT INTO courses (name, description, startdate, enddate, createdby) VALUES ($1, $2, $3, $4, $5)",
    [name, description, startdate, enddate, user],
    (err_, res_) => {
      if (err_) {
        console.error(err_);
        return;
      }
      console.log("course created");

      var response = new CoursesResponse({}, "course created", null);
      res.send(response);
    }
  );
});

app.put("/api/Courses/PutCourse/:id", (request, res) => {
  const req = new CoursesRequest(
    request.body.process,
    request.body.action,
    request.body.data,
    request.body.parameters,
    request.body.user
  );

  console.log("req", req);

  const id = request.params.id;

  const { name, description, startdate, enddate, ind_active, user } =
    JSON.parse(req.data);

  client.query(
    "UPDATE courses SET name = $1, description = $2, startdate = $3, enddate = $4, modifiedby = $5, modifiedon = CURRENT_TIMESTAMP, ind_active = $6 WHERE id = $7",
    [name, description, startdate, enddate, user, ind_active, id],
    (err_, res_) => {
      if (err_) {
        console.error(err_);
        return;
      }

      var response = new CoursesResponse({}, "course updated", null);
      res.send(response);
    }
  );
});

app.delete("/api/Courses/DeleteCourse/:id", (request, res) => {
  const req = new CoursesRequest(
    request.body.process,
    request.body.action,
    request.body.data,
    request.body.parameters,
    request.body.user
  );

  console.log("req", req);

  const id = request.params.id;
  const { user } = req.user;

  /*
  client.query("DELETE FROM courses WHERE id = $1", [id], (err_, res_) => {
    if (err_) {
      console.error(err_);
      return;
    }
    res.send("course deleted");
  });
  */
  //Only inactivate
  client.query(
    "UPDATE courses SET modifiedby = $1, modifiedon = CURRENT_TIMESTAMP, ind_active = 0 WHERE id = $2",
    [user, id],
    (err_, res_) => {
      if (err) {
        console.error(err_);
        return;
      }

      var response = new CoursesResponse({}, "course inactivated", null);
      res.send(response);
    }
  );
});

//CRUD For Classes

app.get("/api/Classes/GetAllClasses", (req, res) => {
  const id = req.params.id;

  client.query("SELECT * FROM classes", (err_, res_) => {
    if (err_) {
      console.error(err_);
      return;
    }

    var response = new CoursesResponse(res_.rows, "", null);
    res.send(response);
  });
});

app.get("/api/Classes/GetClass/:id", (req, res) => {
  const id = req.params.id;

  client.query("SELECT * FROM classes WHERE id = $1", [id], (err_, res_) => {
    if (err_) {
      console.error(err_);
      return;
    }

    var response = new CoursesResponse(res_.rows, "", null);
    res.send(response);
  });
});

app.get("/api/Classes/GetClassesByCourse/:id", (request, res) => {
  const req = new CoursesRequest(
    request.body.process,
    request.body.action,
    request.body.data,
    request.body.parameters,
    request.body.user
  );

  //const id = JSON.parse(req.parameters).id;
  const id = request.params.id;

  console.log("req", req, id);

  client.query(
    "SELECT * FROM classes WHERE course_id = $1 AND ind_active = 1",
    [id],
    (err_, res_) => {
      if (err_) {
        console.error(err_);
        return;
      }

      var response = new CoursesResponse(res_.rows, "", null);
      res.send(response);
    }
  );
});

app.post("/api/Classes/PostClass", (request, res) => {
  const req = new CoursesRequest(
    request.body.process,
    request.body.action,
    request.body.data,
    request.body.parameters,
    request.body.user
  );

  console.log("req", req);

  const { name, description, content, startdate, createdby, course_id } =
    JSON.parse(req.data);

  client.query(
    "INSERT INTO classes (name, description, content, startdate, createdby, course_id) VALUES ($1, $2, $3, $4, $5, $6)",
    [name, description, content, startdate, createdby, course_id],
    (err_, res_) => {
      if (err_) {
        console.error(err_);
        return;
      }
      const response = new CoursesResponse({}, "class created", null);
      res.send(response);
    }
  );
});

app.put("/api/Classes/PutClass/:id", (request, res) => {
  const req = new CoursesRequest(
    request.body.process,
    request.body.action,
    request.body.data,
    request.body.parameters,
    request.body.user
  );

  console.log("req", req);

  const id = request.params.id;

  const {
    name,
    description,
    content,
    startdate,
    modifiedby,
    course_id,
    ind_active,
  } = JSON.parse(req.data);

  client.query(
    "UPDATE classes SET name = $1, description = $2, content = $3, startdate = $4, modifiedby = $5, course_id = $6, ind_active = $7, modifiedon = CURRENT_TIMESTAMP WHERE id = $8",
    [
      name,
      description,
      content,
      startdate,
      modifiedby,
      course_id,
      ind_active,
      id,
    ],
    (err_, res_) => {
      if (err_) {
        console.error(err_);
        return;
      }

      var response = new CoursesResponse({}, "class updated", null);
      res.send(response);
    }
  );
});

app.delete("/api/DeleteClass/:id", (request, res) => {
  const req = new CoursesRequest(
    request.body.process,
    request.body.action,
    request.body.data,
    request.body.parameters,
    request.body.user
  );

  const id = request.params.id;

  const { user } = req.user;

  /*
  client.query("DELETE FROM classes WHERE id = $1", [id], (err_, res_) => {
    if (err_) {
      console.error(err_);
      return;
    }
    res.send("class deleted");
  });
  */
  //Only inactivate
  client.query(
    "UPDATE classes SET modifiedby = $1, modifiedon = CURRENT_TIMESTAMP, ind_active = 0 WHERE id = $2",
    [user, id],
    (err_, res_) => {
      if (err) {
        console.error(err_);
        return;
      }
      var response = new CoursesResponse({}, "class inactivated", null);
      res.send(response);
    }
  );
});
