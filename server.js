import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import BadWordsFilter from "bad-words";

const port = 3000;
const app = express();
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
const filter = new BadWordsFilter();
let input_text = filter.clean("Go to Hell");
// let check = input_text.includes('*');

dotenv.config();
const db = new pg.Client({
    user: 'postgres',
    host: 'localhost',
    database: 'Forum',
    password: process.env.PASSWORD,
    port: 5432
});
db.connect();

async function getQuery() {
    const result = db.query('SELECT user_id, user_name, user_query, created_at FROM QUERY ');
    return result;
}

app.get("/", (req, res) => {
    res.redirect("/index.ejs");
});

app.get("/blogs.ejs", async (req, res) => {
    let query = await getQuery();
    let userName = [];
    let userQuery = [];
    let userUpdateTime = [];
    let userId = [];
    console.log(query.rowCount);
    query.rows.forEach((query) => {
        console.log(query.user_name, query.user_query, query.created_at);
        userName.push(query.user_name);
        userQuery.push(query.user_query);
        userUpdateTime.push(query.created_at);
        userId.push(query.user_id);
    });

    console.log(userName);
    console.log(userQuery);
    console.log(userUpdateTime);
    console.log(userId);

    res.render("blogs.ejs",{
        rows: query.rowCount,
        user: userName,
        time: userUpdateTime,
        query: userQuery,
        id: userId
    });
});

app.get("/index.ejs", (req, res) => {
    res.render("index.ejs");
});

app.post("/add", async (req, res) => {
    // console.log(req.body);
    
    let id = Number(req.body.user_id);
    let name = req.body.user_name;
    let query = req.body.user_query;
    let inQuery = filter.clean(query);
    let check = inQuery.includes('*');
    if(!check)
    {
        try {
            await db.query(`INSERT INTO query (user_id, user_name, user_query) VALUES(${id}, '${name}', '${query}')`);
        } catch(err) {
            console.log(err);
            res.render("index.ejs", {
                error: "Id already exist"
            });
        };
    } else {
        console.log('Can not process');
    }
    res.redirect("/blogs.ejs")
    // console.log(id, name, query);
});

app.post("/delete", async (req, res) => {
    let postId = Number(req.body.postId); 
    console.log(req.body);
    try {
        await db.query(`DELETE FROM query WHERE user_id = ${postId}`);
        res.redirect("/blogs.ejs");
    } catch(err) {
        console.log(err);
        res.render("index.ejs", {
            error: "Failed to delete the post"
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})