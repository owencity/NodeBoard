const express = require("express");
const handlebars = require("express-handlebars");
const app = express();
const postService = require("./services/post-service");
const { ObjectId} = require("mongodb");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mongodbConnection = require("./configs/mongodb-connection");
const { isRegExp } = require("lodash");

app.engine(
    "handlebars",
    handlebars.create({
        helpers: require("./configs/handlebars-helpers"),
    }).engine
);
app.set("view engine", "handlebars");
app.set("views", __dirname + "/views");

// 리스트 페이지
app.get("/", async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || "";
    try {
        const [posts, paginator] = await postService.list(collection, page, search);
        res.render("home", { title: "테스트 게시판", search, paginator, posts });
    } catch (error) {
        console.error(error);
        res.render("home", { title: "비정상 게시판" });
    }
});

app.get("/write", (req, res) => {
    res.render("write", { title: "테스트 게시판", mode: "create" });
});

// 수정 페이지 이동
app.get("/modify/:id", async (req, res) => {
    const post = await postService.getPostById(collection, req.params.id);
    console.log(post);
    res.render("write", { title: "테스트 게시판", mode: "modify", post });
});

// 게시글 수정 API
app.post("/modify/", async (req, res) => {
    const { id, title, writer, password, content } = req.body;

    const post = {
        title,
        writer,
        password,
        content,
        createDt: new Date().toISOString(),
    };

    const result = postService.updatePost(collection, id, post);
    res.redirect(`/detail/${id}`);
});

// 글쓰기
app.post("/write", async (req, res) => {
    const post = req.body;
    const result = await postService.writePost(collection, post);
    res.redirect(`/detail/${result.insertedId}`);
});

app.get("/detail/:id", async (req, res) => {
    const result = await postService.getDetailPost(collection, req.params.id);
    const document = result.value || result;
    res.render("detail", {
        title: "테스트 게시판",
        post: document,
    });
});

// 패스워드 체크
app.post("/check-password", async (req, res) => {
    const { id, password } = req.body;

    const post = await postService.getPostByIdAndPassword(collection, { id, password });

    if (!post) {
        return res.status(400).json({ isExist: false });
    } else {
        return res.json({ isExist: true });
    }
});

// 게시글 삭제
app.delete("/delete", async (req, res) => {
    const { id, password } = req.body;
    try {
        const result = await collection.deleteOne({ _id: ObjectId.createFromHexString(id), password: password });
        if (result.deletedCount !== 1) {
            console.log("삭제 실패");
            return res.json({ isSuccess: false });
        }
        return res.json({ isSuccess: true });
    } catch (error) {
        console.log(error);
        return res.json({ isSuccess: false });
    }
});

// 댓글 추가
app.post("/write-comment", async (req, res) => {
    const { id, name, password, comment } = req.body;
    const post = await postService.getPostById(collection, id);

    if (post.comments) {
        post.comments.push({
            idx: post.comments.length + 1,
            name,
            password,
            comment,
            createdDt: new Date().toISOString(),
        });
    } else {
        post.comments = [
            {
                idx: 1,
                name,
                password,
                comment,
                createdDt: new Date().toISOString(),
            },
        ];
    }
    postService.updatePost(collection, id, post);
    return res.redirect(`/detail/${id}`);
});

//댓글 삭제
app.delete("/delete-comment", async (req, res) => {
    const {id, idx, password} = req.body;

    // 게시글 comments 안에잇는 특정 데이터를 찾기
    const post = await collection.findOne({
        _id: ObjectId.createFromHexString(id),
        comments : { $elemMatch : { idx : parseInt(idx), password}}, // $elemMatch 연산자 -> 도큐먼트 안에 있는 리스트에서 조건에 해당하는 데이터가 있으면 도큐먼트를 결괏값으로 줌 
        // 해당 조건에 만족하는 모든 댓글 내용(도큐먼트)를 가져옴
    },  
    postService.projectionOption,);

    // 데이터가 없으면 isSuccess : false를 주면서 종료
    if(!post) {
        return res.json ({ isSuccess : false });
    }

    // 댓글 번호가 idx 이외인 것만 comments에 다시 할당 후 저장 
    post.comments = post.comments.filter((comment) => comment.idx != idx);
    postService.updatePost(collection, id, post);
    return res.json({ isSuccess : true });
});
let collection;

app.listen(3000, async () => {
    console.log("Server started");
    const mongoClient = await mongodbConnection();
    collection = mongoClient.db().collection("post");
    console.log("MongoDB connected");
});
