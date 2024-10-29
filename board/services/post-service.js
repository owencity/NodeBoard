const paginator = require("../utils/paginator")
const { ObjectId } = require("mongodb");


// 글쓰기
async function writePost(collection, post) {
    post.hits = 0;
    post.createdDt = new Date().toISOString();
    return await collection.insertOne(post);
}

// 글목록 
async function list(collection , page, search) {
    const perPage = 10;
    const query = { title : new RegExp(search , "i")}; // 1
    const cursor = collection.find(query, { limit : perPage, skip: (page -1) * perPage}) //2
    .sort({
        createDt: -1,
    });
    const totalCount = await collection.count(query); //3
    const posts = await cursor.toArray(); //4
    const paginatorObj = paginator({ totalCount, page, perPage: perPage}); //5
    return [posts, paginatorObj]
};

// 패스워드 노출 할 필요가 없으므로 결괏값으로 가져오지 않음
const projectionOption = { // 프로젝션 -> 투영 , DB에서는 데이터베이스에서 필요한 필드들만 선택해서 가져오는 것을 말함
    projection : {
        // 프로젝션 결괏값에서 일부만 가져올 떄 사용
        password : 0,
        "comments.password" : 0,
    },
};

async function getDetailPost(collection, id) {
    
    const result1 = await collection.findOne({ _id: new ObjectId(id) });
    console.log("테스트: " + result1.value);
    
    const result = await collection.findOneAndUpdate( // 더이상 value 값으로반환x, 원본 문서로 반환
      { _id: ObjectId.createFromHexString(id) },
      { $inc: { hits: 1 } },
      projectionOption
    );
    
    console.log(result);
    return result;
  }
// async function getDetailPost(collection, id) { // 하나의 게시글 정보 가져옴 , 읽을때마다 hits 1증가 , 몽고db함수 사용
    
//     const result =  await collection.findOneAndUpdate
//     ({ _id :  ObjectId(id) } ,
//      { $inc: { hits: 1}} ,
//       projectionOption); // $inc는 값을 증가(increase) 시키고싶을 때 사용하는 연산자
//     return result;

//     // 실무에서는 ip나 device 등을 체크해 어뷰징 못하게하는 방법을 사용(획기적이군) 
//     // 추후프로젝트 조회랭크에 따른 핫글 목록 괜춘한듯?
// }

async function getPostByIdAndPassword(collection , {id, password}) {
     return await collection.findOne(
        { _id : ObjectId.createFromHexString(id), 
            password : password}, 
            projectionOption);
}

// id 로 데이터 불러오기
async function getPostById(collection, id) {
    return await collection.findOne(
        { _id : new ObjectId(id)}
    , projectionOption);
}

// 게시글 수정
async function updatePost(collection , id, post) {
    const toUpdatePost = {
        $set: {
            ...post,
        },
    };
    return await collection.updateOne(
        { _id: ObjectId.createFromHexString(id)}
        , toUpdatePost);
}


module.exports = {
    list,
    writePost,
    getDetailPost,
    getPostById,
    getPostByIdAndPassword,
    updatePost,
    projectionOption,
};