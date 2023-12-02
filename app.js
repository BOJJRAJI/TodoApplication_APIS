const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "./todoApplication.db");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const toDate = require("date-fns/toDate");
let db = null;
app.use(express.json());
const connectDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running on 3000 port.......!");
    });
  } catch (e) {
    console.log(`Error:${e.message}`);
  }
};

connectDbAndServer();

const checkRequestsBody = (request, response, next) => {
  const { id, todo, category, priority, status, dueDate } = request.body;
  const { todoId } = request.params;

  if (category !== undefined) {
    categoryArray = ["WORK", "HOME", "LEARNING"];
    categoryIsInArray = categoryArray.includes(category);

    if (categoryIsInArray === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (priority !== undefined) {
    priorityArray = ["HIGH", "MEDIUM", "LOW"];
    priorityIsInArray = priorityArray.includes(priority);
    if (priorityIsInArray === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    statusIsInArray = statusArray.includes(status);
    if (statusIsInArray === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate);
      const formatedDate = format(new Date(dueDate), "yyyy-MM-dd");
      console.log(formatedDate);
      const result = toDate(new Date(formatedDate));
      const isValidDate = isValid(result);
      console.log(isValidDate);
      console.log(isValidDate);
      if (isValidDate === true) {
        request.dueDate = formatedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }
  request.todo = todo;
  request.id = id;

  request.todoId = todoId;

  next();
};

const checkRequestsQueries = async (request, response, next) => {
  const { search_q, category, priority, status, date } = request.query;
  const { todoId } = request.params;
  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    const categoryIsInArray = categoryArray.includes(category);
    if (categoryIsInArray === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (priority !== undefined) {
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];
    const priorityIsInArray = priorityArray.includes(priority);
    if (priorityIsInArray === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    const statusIsInArray = statusArray.includes(status);
    if (statusIsInArray === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (date !== undefined) {
    try {
      const myDate = new Date(date);

      const formatedDate = format(new Date(date), "yyyy-MM-dd");
      console.log(formatedDate, "f");
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${myDate.getMonth() + 1}-${myDate.getDate()}`
        )
      );
      console.log(result, "r");
      console.log(new Date(), "new");

      const isValidDate = await isValid(result);
      console.log(isValidDate, "V");
      if (isValidDate === true) {
        request.date = formatedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }

  request.todoId = todoId;
  request.search_q = search_q;

  next();
};

//API1
app.get("/todos/", checkRequestsQueries, async (req, res) => {
  const { status = "", search_q = "", priority = "", category = "" } = req;
  console.log(status, search_q, priority, category);
  const getTodosQuery = `
        SELECT 
            id,
            todo,
            priority,
            status,
            category,
            due_date AS dueDate 
        FROM 
            todo
        WHERE 
        todo LIKE '%${search_q}%' AND priority LIKE '%${priority}%' 
        AND status LIKE '%${status}%' AND category LIKE '%${category}%';`;

  const todosArray = await db.all(getTodosQuery);
  res.send(todosArray);
});

//API2
app.get("/todos/:todoId/", checkRequestsQueries, async (req, res) => {
  const { todoId } = req;
  const dbQuery = `
        SELECT id,
            todo,
            priority,
            status,
            category,
            due_date AS dueDate
             FROM todo where id=${todoId}
    `;
  const dbResult = await db.get(dbQuery);
  res.send(dbResult);
});
//API3
app.get("/agenda/", checkRequestsQueries, async (req, res) => {
  const { date } = req;
  const dbQuery = `
        SELECT id,
            todo,
            priority,
            status,
            category,
            due_date AS dueDate
             FROM todo where due_date='${date}'
    `;
  const dbResult = await db.all(dbQuery);
  if (dbResult === undefined) {
    res.status(400);
    res.send("Invalid Due Date");
  } else {
    res.send(dbResult);
  }
});
//API4
app.post("/todos/", checkRequestsBody, async (req, res) => {
  const { id, status, priority, todo, category, dueDate } = req;
  const dbQuery = `
        INSERT INTO todo (id,todo,priority,status,category,due_date)
        VALUES (
           ${id},
           '${todo}',
           '${priority}',
           '${status}',
           '${category}',
           '${dueDate}'
        )
    ;`;
  await db.run(dbQuery);
  res.send("Todo Successfully Added");
});
//API 5
app.put("/todos/:todoId/", checkRequestsBody, async (req, res) => {
  const { todoId } = req;
  const { status, priority, todo, category, dueDate } = req;
  if (status !== undefined) {
    const dbQuery = `
         UPDATE todo SET status='${status}' where id=${todoId}
        ;`;
    await db.run(dbQuery);
    res.send("Status Updated");
  } else if (priority !== undefined) {
    const dbQuery = `
         UPDATE todo SET priority='${priority}' where id=${todoId}
        ;`;
    await db.run(dbQuery);
    res.send("Priority Updated");
  } else if (todo !== undefined) {
    const dbQuery = `
         UPDATE todo SET todo='${todo}' where id=${todoId}
        ;`;
    await db.run(dbQuery);
    res.send("Todo Updated");
  } else if (category !== undefined) {
    const dbQuery = `
         UPDATE todo SET category='${category}' where id=${todoId}
        ;`;
    await db.run(dbQuery);
    res.send("Category Updated");
  } else {
    const dbQuery = `
         UPDATE todo SET due_date='${dueDate}' where id=${todoId}
        ;`;
    await db.run(dbQuery);
    res.send("Due Date Updated");
  }
});
//API 6
app.delete("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  const dbQuery = `
        DELETE  FROM todo where id=${todoId}
    `;
  await db.run(dbQuery);
  res.send("Todo Deleted");
});

module.exports = app;
