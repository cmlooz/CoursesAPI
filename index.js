import express from "express";
import pg from "pg";

//Connecting to the database
const { Client } = pg;

const init_client = new Client({
  user: "postgres",
  host: "localhost",
  //host: "postgresql-server",
  password: "HDLCrin8*",
  port: 5432,
});

init_client.connect((err) => {
  if (err) {
    console.error("Connection error:", err.stack);
  } else {
    init_client.query("CREATE DATABASE Courses;", (err_, res_) => {
      if (err_) {
        console.error(err_);
        return;
      }
      console.log("Database created");
    });

    init_client.end();

    console.log("Initial Connected to PostgreSQL server");
  }
});

/*
await init_client.query("CREATE DATABASE Courses;", (err_, res_) => {
  if (err_) {
    console.error(err_);
    return;
  }
  console.log("Database created");
});

await init_client.end();
*/

const client = new Client({
  user: "postgres",
  host: "postgresql-server",
  database: "Courses",
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
    console.log("Table Courses created");
  }
);

client.query(
  "CREATE TABLE IF NOT EXISTS classes (id SERIAL PRIMARY KEY, name VARCHAR(200) NOT NULL, description VARCHAR(1500) NOT NULL, content TEXT NOT NULL, startdate TIMESTAMP NOT NULL, createdon TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, createdby VARCHAR(50), ind_active SMALLINT DEFAULT 1 NOT NULL, modifiedon TIMESTAMP NULL, modifiedby VARCHAR(50) NULL, course_id INT NOT NULL, FOREIGN KEY (course_id) REFERENCES Courses (id));",
  (err_, res_) => {
    if (err_) {
      console.error(err_);
      return;
    }
    console.log("Table Courses created");
  }
);

//client.end();

//Creating the API
const app = express();

const port = 80;

app.listen(port, () => {
  console.log("SERVER: http://localhost:" + port);
});

//CRUD For Courses

app.get("/api/Courses/GetAllCourses", (req, res) => {
  client.query("SELECT * FROM Courses", (err_, res_) => {
    if (err_) {
      console.error(err_);
      return;
    }
    res.send(res_.rows);
  });
});

app.get("/api/Courses/GetCourse/:id", (req, res) => {
  const id = req.params.id;

  client.query("SELECT * FROM Courses WHERE id = $1", [id], (err_, res_) => {
    if (err_) {
      console.error(err_);
      return;
    }
    res.send(res_.rows);
  });
});

app.post("/api/Courses/PostCourse", (req, res) => {
  const { name, description, startdate, enddate, user } = req.body;

  client.query(
    "INSERT INTO Courses (name, description, startdate, enddate, createdby) VALUES ($1, $2, $3, $4, $5)",
    [name, description, startdate, enddate, user],
    (err_, res_) => {
      if (err_) {
        console.error(err_);
        return;
      }
      res.send("Course created");
    }
  );
});

app.put("/api/Courses/PutCourse/:id", (req, res) => {
  const id = req.params.id;
  const { name, description, startdate, enddate, ind_active, user } = req.body;

  client.query(
    "UPDATE Courses SET name = $1, description = $2, startdate = $3, enddate = $4, modifiedby = $5, modifiedon = CURRENT_TIMESTAMP, ind_active = $6 WHERE id = $7",
    [name, description, startdate, enddate, user, ind_active, id],
    (err_, res_) => {
      if (err_) {
        console.error(err_);
        return;
      }
      res.send("Course updated");
    }
  );
});

app.delete("/api/Courses/DeleteCourse/:id", (req, res) => {
  const id = req.params.id;
  const { user } = req.body;

  /*
  client.query("DELETE FROM Courses WHERE id = $1", [id], (err_, res_) => {
    if (err_) {
      console.error(err_);
      return;
    }
    res.send("Course deleted");
  });
  */
  //Only inactivate
  client.query(
    "UPDATE Courses SET modifiedby = $1, modifiedon = CURRENT_TIMESTAMP, ind_active = 0 WHERE id = $2",
    [user, id],
    (err_, res_) => {
      if (err) {
        console.error(err_);
        return;
      }
      res.send("Course updated");
    }
  );
});

//CRUD For Classes

app.get("/api/Classes/GetClass/:id", (req, res) => {
  const id = req.params.id;

  client.query("SELECT * FROM Classes WHERE id = $1", [id], (err_, res_) => {
    if (err_) {
      console.error(err_);
      return;
    }
    res.send(res_.rows);
  });
});

app.get("/api/Classes/GetClassesByCourse/:id", (req, res) => {
  const id = req.params.id;

  client.query(
    "SELECT * FROM Classes WHERE course_id = $1 AND ind_active = 1",
    [id],
    (err_, res_) => {
      if (err_) {
        console.error(err_);
        return;
      }
      res.send(res_.rows);
    }
  );
});

app.post("/api/Classes/PostClass", (req, res) => {
  const { name, description, content, startdate, createdby, course_id } =
    req.body;

  client.query(
    "INSERT INTO Classes (name, description, content, startdate, createdby, course_id) VALUES ($1, $2, $3, $4, $5, $6)",
    [name, description, content, startdate, createdby, course_id],
    (err_, res_) => {
      if (err_) {
        console.error(err_);
        return;
      }
      res.send("Class added");
    }
  );
});

app.put("/api/Classes/PutClass/:id", (req, res) => {
  const id = req.params.id;
  const {
    name,
    description,
    content,
    startdate,
    modifiedby,
    course_id,
    ind_active,
  } = req.body;

  client.query(
    "UPDATE Classes SET name = $1, description = $2, content = $3, startdate = $4, modifiedby = $5, course_id = $6, ind_active = $7, modifiedon = CURRENT_TIMESTAMP WHERE id = $8",
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
      res.send("Class updated");
    }
  );
});

app.delete("/api/DeleteClass/:id", (req, res) => {
  const id = req.params.id;
  const { user } = req.body;

  /*
  client.query("DELETE FROM Classes WHERE id = $1", [id], (err_, res_) => {
    if (err_) {
      console.error(err_);
      return;
    }
    res.send("Class deleted");
  });
  */
  //Only inactivate
  client.query(
    "UPDATE Classes SET modifiedby = $1, modifiedon = CURRENT_TIMESTAMP, ind_active = 0 WHERE id = $2",
    [user, id],
    (err_, res_) => {
      if (err) {
        console.error(err_);
        return;
      }
      res.send("Class updated");
    }
  );
});
