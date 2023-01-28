const express = require("express");
const app = express();
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
let db = null;
const initialize = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running...");
    });
  } catch (error) {
    console.log(`db error ${error.message}`);
    process.exit(1);
  }
};
initialize();
//api 1
app.post("/register", async (request, response) => {
  const { username, password, gender, location, name } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username='${username}'`;
  const hashedPassword = await bcrypt.hash(password, 10);
  let dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    //create user
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const userCreateQuery = `INSERT INTO user(username,password,gender,location,name)
            VALUES(${username},${hashedPassword},${gender},${location},${name});`;
      response.send("User created successfully");
    }
  } else {
    //already exist
    response.status(400);
    response.send("User already exists");
  }
});
//API 2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username='${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    //user doesn't exist
    response.status(400);
    response.send("Invalid user");
  } else {
    //user exist check for password
    const isPasswordMatch = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatch === true) {
      //login success
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3 /change-password
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username='${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    //user doesn't exist
    response.status(400);
    response.send("User doensnot exists");
  } else {
    //check oldpassword should match
    const isPasswordMatch = await bcrypt.compare(oldPassword, dbUser.password);
    if (isPasswordMatch === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const newHashedPassword = await bcrypt.hash(newPassword, 10);
        const postQuery = `UPDATE user SET password=${newHashedPassword} WHERE username='${username}'`;
        await db.run(postQuery);
        response.send("Password updated");
      }
    } else {
      response.send("Invalid current password");
      response.status(400);
    }
  }
});
module.exports = app;
