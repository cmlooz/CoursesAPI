import express, { request, response } from "express";
//import basicAuth from "express-basic-auth";
import pg from "pg";
//Connecting to the database
const { Client } = pg;

import bodyParser from "body-parser";

import CoursesRequest from "./Wrappers/CoursesRequest.js";
import CoursesResponse from "./Wrappers/CoursesResponse.js";
import auth from "./auth.js";

//import sendMessageToKafka from "./messager.js";

const client = new Client({
  user: "postgres",
  host: "localhost",
  //host: "postgresql-server-service",
  database: "courses_db",
  password: "HDLCrin8*",
  port: 5432,
});

client.on("error", (err) => {
  console.error("Client error:", err.stack);
  //sendMessageToKafka("client.onError", err.message);
});

client.connect((err) => {
  if (err) {
    console.error("Connection error:", err.stack);
    //sendMessageToKafka("client.connectError", err.message);

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
      //sendMessageToKafka("client.queryError", err_.message);
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
      //sendMessageToKafka("client.queryError", err_.message);
      return;
    }
    console.log("Table classes created");
  }
);

//client.end();

//Creating the API
const app = express();

const port = 8090;

app.listen(port, () => {
  console.log("SERVER: http://localhost:" + port);
});

//To JSON Handle
app.use(bodyParser.json());

//For Auth
app.use(auth);

//CRUD For Courses

app.get("/api/Courses/GetAllCourses", (req, res) => {
  console.log("req", req);
  client.query("SELECT * FROM courses", (err_, res_) => {
    if (err_) {
      console.error(err_);
      const errors = new CoursesResponse(null, "error", err_);
      //sendMessageToKafka("api/Courses/GetAllCourses", err_.message);
      res.send(errors);
    }

    const response = new CoursesResponse(res_.rows, "", null);
    console.log("res", response);

    res.send(response);
  });
});

app.get("/api/Courses/GetCourse/:id", (req, res) => {
  const id = req.params.id;

  client.query("SELECT * FROM courses WHERE id = $1", [id], (err_, res_) => {
    if (err_) {
      console.error(err_);
      const errors = new CoursesResponse(null, "error", err_);
      //sendMessageToKafka("api/Courses/GetCourse/" + id, err_.message);
      res.send(errors);
    }

    const response = new CoursesResponse(res_.rows, "", null);
    res.send(response);
  });
});

/*
--sample body request
{
  "process":"Courses",
  "action":"PostCourse",
  "data":"{ \"name\":\"_name\", \"description\":\"_description\", \"startdate\":\"_startdate\", \"enddate\":\"_enddate\", \"userid\":\"_userid\" }",
  "parameters":"{}",
  "userid":"_userid"
}
*/

app.post("/api/Courses/PostCourse", (request, res) => {
  const req = new CoursesRequest(
    request.body.process,
    request.body.action,
    request.body.data,
    request.body.parameters,
    request.body.userid
  );

  console.log("req", req);

  const { name, description, startdate, enddate, userid } = JSON.parse(
    req.data
  );

  client.query(
    "INSERT INTO courses (name, description, startdate, enddate, createdby, createdon) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)",
    [name, description, startdate, enddate, userid],
    (err_, res_) => {
      if (err_) {
        const errors = new CoursesResponse(null, "error", err_);
        //sendMessageToKafka("api/Courses/PostCourse", err_.message);
        res.send(errors);
      }
      console.log("course created");

      const response = new CoursesResponse({}, "course created", null);
      res.send(response);
    }
  );
});

/*
--sample body request
{
  "process":"Courses",
  "action":"PutCourse",
  "data":"{ \"name\":\"_name\", \"description\":\"_description\", \"startdate\":\"_startdate\", \"enddate\":\"_enddate\", \"userid\":\"_userid\" }",
  "parameters":"{\"id\":_id}",
  "userid":"_userid"
}
*/
app.put("/api/Courses/PutCourse/:id", (request, res) => {
  const req = new CoursesRequest(
    request.body.process,
    request.body.action,
    request.body.data,
    request.body.parameters,
    request.body.userid
  );

  console.log("req", req);

  const id = request.params.id;

  const { name, description, startdate, enddate, userid } = JSON.parse(
    req.data
  );

  client.query(
    "UPDATE courses SET name = $1, description = $2, startdate = $3, enddate = $4, modifiedby = $5, modifiedon = CURRENT_TIMESTAMP, WHERE id = $6",
    [name, description, startdate, enddate, userid, id],
    (err_, res_) => {
      if (err_) {
        console.error(err_);
        const errors = new CoursesResponse(null, "error", err_);
        //sendMessageToKafka("api/Courses/PutCourse/" + id, err_.message);
        res.send(errors);
      }

      const response = new CoursesResponse({}, "course updated", null);
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
    request.body.userid
  );

  console.log("req", req);

  const id = request.params.id;
  const { userid } = req.userid;

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
    [userid, id],
    (err_, res_) => {
      if (err) {
        console.error(err_);
        const errors = new CoursesResponse(null, "error", err_);
        //sendMessageToKafka("api/Courses/DeleteCourse/" + id, err_.message);
        res.send(errors);
      }

      const response = new CoursesResponse({}, "course inactivated", null);
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
      const errors = new CoursesResponse(null, "error", err_);
      //sendMessageToKafka("api/Courses/GetAllClases", err_.message);
      res.send(errors);
    }

    const response = new CoursesResponse(res_.rows, "", null);
    res.send(response);
  });
});

app.get("/api/Classes/GetClass/:id", (req, res) => {
  const id = req.params.id;

  client.query("SELECT * FROM classes WHERE id = $1", [id], (err_, res_) => {
    if (err_) {
      console.error(err_);
      const errors = new CoursesResponse(null, "error", err_);
      //sendMessageToKafka("api/Courses/GetClass/" + id, err_.message);
      res.send(errors);
    }

    const response = new CoursesResponse(res_.rows, "", null);
    res.send(response);
  });
});

app.get("/api/Classes/GetClassesByCourse/:id", (request, res) => {
  const req = new CoursesRequest(
    request.body.process,
    request.body.action,
    request.body.data,
    request.body.parameters,
    request.body.userid
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
        const errors = new CoursesResponse(null, "error", err_);
        //sendMessageToKafka("api/Courses/GetClassesByCourse/" + id,err_.message);
        res.send(errors);
      }

      const response = new CoursesResponse(res_.rows, "", null);
      res.send(response);
    }
  );
});

/*
--sample body request
{
  "process":"Classes",
  "action":"PostClass",
  "data":"{ \"name\":\"_name\", \"description\":\"_description\", \"content\":\"_content\", \"startdate\":\"_startdate\", \"userid\":\"_userid\", \"course_id\": _courseid }",
  "parameters":"{}",
  "userid":"_userid"
}
*/
app.post("/api/Classes/PostClass", (request, res) => {
  const req = new CoursesRequest(
    request.body.process,
    request.body.action,
    request.body.data,
    request.body.parameters,
    request.body.userid
  );

  console.log("req", req);

  const { name, description, content, startdate, userid, course_id } =
    JSON.parse(req.data);

  client.query(
    "INSERT INTO classes (name, description, content, startdate, createdby, course_id, createdon) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)",
    [name, description, content, startdate, userid, course_id],
    (err_, res_) => {
      if (err_) {
        console.error(err_);
        const errors = new CoursesResponse(null, "error", err_);
        //sendMessageToKafka("api/Courses/PostClass", err_.message);
        res.send(errors);
      }
      const response = new CoursesResponse({}, "class created", null);
      res.send(response);
    }
  );
  const response = new CoursesResponse({}, "class created", null);
  res.send(response);
});

/*
--sample body request
{
  "process":"Classes",
  "action":"PutClass",
  "data":"{ \"name\":\"_name\", \"description\":\"_description\", \"content\":\"_content\", \"startdate\":\"_startdate\", \"userid\":\"_userid\"}",
  "parameters":"{\"id\":_id}",
  "userid":"_userid"
}
*/
app.put("/api/Classes/PutClass/:id", (request, res) => {
  const req = new CoursesRequest(
    request.body.process,
    request.body.action,
    request.body.data,
    request.body.parameters,
    request.body.userid
  );

  console.log("req", req);

  const id = request.params.id;

  const { name, description, content, startdate, userid } = JSON.parse(
    req.data
  );

  client.query(
    "UPDATE classes SET name = $1, description = $2, content = $3, startdate = $4, modifiedby = $5, course_id = $6, modifiedon = CURRENT_TIMESTAMP WHERE id = $7",
    [name, description, content, startdate, userid, course_id, id],
    (err_, res_) => {
      if (err_) {
        console.error(err_);
        const errors = new CoursesResponse(null, "error", err_);
        //sendMessageToKafka("api/Courses/PutClass/" + id, err_.message);
        res.send(errors);
      }

      const response = new CoursesResponse({}, "class updated", null);
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
    request.body.userid
  );

  const id = request.params.id;

  const { userid } = req.userid;

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
    [userid, id],
    (err_, res_) => {
      if (err) {
        console.error(err_);
        const errors = new CoursesResponse(null, "error", err_);
        //sendMessageToKafka("api/Courses/DeleteClass/" + id, err_.message);
        res.send(errors);
      }
      const response = new CoursesResponse({}, "class inactivated", null);
      res.send(response);
    }
  );
});
