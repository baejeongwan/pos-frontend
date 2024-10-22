function loadMenuData() {
    console.groupCollapsed("메뉴 목록 불러오기")
    let menuOrigData = [
        {
            sectionName: "음료",
            menus: [
                {
                    menuName: "음료수 1번",
                    menuCode: "d01"
                },
                {
                    menuName: "음료수 2번",
                    menuCode: "d02"
                },
                {
                    menuName: "음료수 3번",
                    menuCode: "d03"
                },
                {
                    menuName: "음료수 4번",
                    menuCode: "d04"
                },
                {
                    menuName: "음료수 5번",
                    menuCode: "d05"
                }
            ]
        },
        {
            sectionName: "베이커리",
            menus: [
                {
                    menuName: "베이 1번",
                    menuCode: "b01"
                },
                {
                    menuName: "베이 2번",
                    menuCode: "b02"
                },
                {
                    menuName: "베이 1번",
                    menuCode: "b01"
                },
                {
                    menuName: "베이 2번",
                    menuCode: "b02"
                },
                {
                    menuName: "베이 1번",
                    menuCode: "b01"
                },
                {
                    menuName: "베이 2번",
                    menuCode: "b02"
                },
                {
                    menuName: "베이 1번",
                    menuCode: "b01"
                },
                {
                    menuName: "베이 2번",
                    menuCode: "b02"
                }
            ]
        }
    ]
    
    let menuOnlyList = []
    menuOrigData.forEach((e) => {
        e.menus.forEach((e) => menuOnlyList.push(e))
    })

    console.warn("현재 이 코드는 하드 코딩된 문자열을 반환합니다. PRODUCTION 상태에서는 이 코드가 수정될 필요가 있습니다.\n다음으로 수정을 제안합니다.\n - JSON에서 불러오기\n - HTTP를 통해 서버의 DB등에서 불러오기.")
    console.log("메뉴 데이터", menuOrigData, menuOnlyList)
    console.groupEnd()
    return [menuOrigData, menuOnlyList]
}

export { loadMenuData }