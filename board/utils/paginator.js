const lodash = require("lodash") 
//1 최대 10페이지가 나오게 하려면 시작끝 숫자 들어있는 리스트 만들어야하는데 편리하게 만들수있는 함수가 lodash.range() 함수 lodash.range(1, 11) -> 1~10 구성된 리스트반환
const PAGE_LIST_SIZE = 10; // 2 . 총 보여줄 페이지 리스트

//3
module.exports = ({ totalCount, page, perPage = 10}) => {
    const PER_PAGE = perPage;
    const totalPage = Math.ceil(totalCount / PER_PAGE); // 4 ceil 함수 -> 소수점 있으면 무조건 큰정수로 올림 4.1 도 5  4.5 도 5 , round는 소수점 첫째자리 기준 반올림 4.1 -> 4 4.5 -> 5
    // total 글 개수를 perPage로 나누어 계산 -> 11개의 글개수면 2페이지로 나뉘어야 하니 -> 1.1 ceil 계산하여 2페이지 생성
    // 시작 페이지 
    let quotient = parseInt(page / PAGE_LIST_SIZE); // page는 현재 페이지 , page_list_size는 한페이지 목록에서 표시할 페이지 수, 현재페이지가 몇 번째 페이지 묶음에 속하는지 계산하고 정수 부분만 가져옴
    if (page % PAGE_LIST_SIZE === 0) { // 
        quotient -= 1
    }
    const startPage = quotient * PAGE_LIST_SIZE + 1; //5

    // 끝 페이지 : startPage + PAGE_LIST_SIZE - 1
    const endPage = startPage + PAGE_LIST_SIZE - 1 < totalPage ? startPage + PAGE_LIST_SIZE - 1 : totalPage; // 6
    const isFirstPage = page === 1;
    const isLastPage = page === totalPage;
    const hasPrev = page > 1;
    const hasNext = page < totalPage;
    
    const paginator = {
        // 7
        pageList : lodash.range(startPage, endPage + 1),
        page,
        prevPage : page - 1,
        nextPage : page + 1,
        startPage,
        lastPage : totalPage,
        hasPrev,
        hasNext,
        isFirstPage,
        isLastPage,
    };
    return paginator;
}



