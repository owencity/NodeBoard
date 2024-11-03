const paginator = require("../utils/paginator")
const { ObjectId } = require("mongodb");


/* 
    다음 글쓰기,목록조회,삭제,수정 등에 왜 async await 비동기 처리를 한 이유가 무엇인가?
    데이터베이스 작업의 성공 여부를 확실히 보장하기 위해 사용한다. 
    데이터베이스 작업은 네트워크를 통해 이루어지므로 지연이 발생할수 있고, 비용이 큰 작업할시 서버의 응답을 기다리는동안 다른 작업을 막지 않기위해 사용하며
    데이터를 디스크에 저장하거나 디스크에서 읽어오는 과정이기 때문에 입출력 대기시간이 발생하며, 이 또한 비동기작업으로 처리해야한다. 
    
    정리 주 이유 
    1. 성능향상 : 비동기 처리를 하면 다른작업들이 차례로 실행되는것을 막지 않기때문에 
    2. 사용자 경험 개선 : 웹의 경우, 비동기처리로인해 끝날 때까지 기다리지 않아도 되므로 사용자에게 더빠르고 끊김없는 경험을 제공할 수 있다.
    3. 효율적인 자원 사용 : 서버작업 완료를 기다리는 동안 유후 상태로 있게 하지않고, 다른작업을 처리할 수 있다.
*/

// 글쓰기
async function writePost(collection, post) {
    post.hits = 0; // 글 작성시 조회수는 0 , 이후 사용자가 조회할떄마다 0에서 증가
    post.createdDt = new Date().toISOString();
    return await collection.insertOne(post);
}


// 글목록 
async function list(collection , page, search) {
    const perPage = 10;
    const query = { title : new RegExp(search , "i")}; // 1, RegExp(search, i) : i(대소문자 구분없이) search 를 검색하라는 내장객체
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
        password : 0,  // 쿼리결과에서 제외
        "comments.password" : 0, // 쿼리결과에서 제외
    },
};

async function getDetailPost(collection, id) { 
    
    const result1 = await collection.findOne({ _id: id }); 
    // id굳이 변환할 필요없이 바로 넘겨줘도 무방 
    // 업데이트로 ObjectId만 쓰지않고 new를 붙여쓰거나 ObjectId.createFromHexString를 사용
    console.log("테스트: " + result1); // fineOne은 문서자체를 반환하기떄문에 value 필요없음.
    
    const result = await collection.findOneAndUpdate( // 더이상 value 값으로반환x, 원본 문서로 반환 findOneAndUpdate(filter, update, option)
        { _id: ObjectId.createFromHexString(id) },    // filter 
        { $inc: { hits: 1 } }, // update
        projectionOption // option , 비밀번호를 굳이 가져와서 보여줄 필요없으므로 제외하는 옵션 추가
    );
    
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
        // { _id : ObjectId.createFromHexString(id),  
            { _id : new ObjectId(id),   // new 권장되지않으나 사용가능
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