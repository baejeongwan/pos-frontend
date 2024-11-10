/**
 * POS 시스템의 구동의 핵심 모듈
 * @module main
 * @author Bae Jeongwan <jayden.bae@outlook.kr>
 * @version 1.0.0
 * @license GPL
 */
import { io } from "socket.io-client"
import Swal from "sweetalert2"

const socket = io()
let orderPendingList = []

let pendingSelected = null;

let discountPendingList = []

let discountSelected = null;

let currentOrders = []

let menuList = [];
let menuOnlyList = [];

init()

/** POS 시스템을 시작한다. */
function init() {
    // 경고 메시지
    console.log(`    _____   ____   _____ 
    |  __ \ / __ \ / ____|
    | |__) | |  | | (___  
    |  ___/| |  | |\___ \ 
    | |    | |__| |____) |
    |_|     \____/|_____/ `)

    console.log("시작하는중... / 현재시각: ", new Date())
    console.log("%c경고%c\n개발자 콘솔에 지금 무엇을 하려는지 알고있지 않다면 절대로 붙여넣지 마십시오.", "color: red; font-size:xxx-large;", "color: inherit; font-size: inherit;")

    console.group("시동")
    Swal.fire({
        title: "접속중입니다...",
        text: "서버에 연결하고 있습니다. 잠시만 기다려주십시오.",
        didOpen: () => {
            Swal.showLoading()
        },
        allowEscapeKey: false,
        allowOutsideClick: false
    })

    socketIOControl()
}

function socketIOControl() {
    socket.on("connect", () => {
        if (socket.recovered) {
            // 복구된 통신 - 진입된 상점이 맞는지 확인
            socket.emit("get-what-shop-in")
        } else {
            // 새로운 통신 혹은 복구된 통신 [재인증 필요]
            socketLogin(false)
        }
    })

    socket.on("connect_error", (error) => {
        console.error("Socket.IO 통신의 연결에 실패했습니다.")
        if (socket.active) {
            // 일시적 오류
            Swal.fire({
                icon: "error",
                title: "서버 접속 실패",
                text: "서버에 Socket.IO 통신 실패. 일시적 오류입니다."
            }).then(() => {
                if (!socket.connected) {
                    Swal.fire({
                        title: "접속중입니다...",
                        text: "서버에 연결하고 있습니다. 잠시만 기다려주십시오.",
                        didOpen: () => {
                            Swal.showLoading()
                        },
                        allowEscapeKey: false,
                        allowOutsideClick: false
                    })      
                }
            })
        } else {
            // 영구적 오류
            Swal.fire({
                icon: "error",
                title: "서버 접속 실패",
                text: "서버에 Socket.IO 통신을 연결하는 중 오류가 발생하였습니다. 자세한 내용: " + error.message,
                confirmButtonText: "새로 고침",
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then(() => window.location.reload())
        }
    })

    socket.on("cook-complete-ok", (arg) => {
        Swal.fire({
            toast: true,
            title: "조리 완료",
            text: "일부 주문이 조리 완료되었습니다.",
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false,
            didOpen: (toast) => {
                toast.onmouseenter = Swal.stopTimer;
                toast.onmouseleave = Swal.resumeTimer;
            },
            position: "top-end"
        })

        currentOrders = arg
        updateOrders()
    })

    socket.on("refund-request-ok", (arg) => {
        Swal.fire({
            toast: true,
            title: "환불 완료",
            text: "일부 주문이 환불처리되었습니다.",
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false,
            didOpen: (toast) => {
                toast.onmouseenter = Swal.stopTimer;
                toast.onmouseleave = Swal.resumeTimer;
            },
            position: "top-end"
        })

        currentOrders = arg
        updateOrders()
    })

    socket.on("login-ok", () => {
        let searchParam = new URLSearchParams(window.location.search)
        if (searchParam.has("store")) {
            socket.emit("join-shop", new URLSearchParams(window.location.search).get("store"))
        } else {
            Swal.fire({
                icon: "error",
                title: "비 정상적인 접근",
                text: "URL에 쿼리스트링이 제공되지 않아 더이상 진행할 수 없습니다.",
                confirmButtonText: "뒤로가기",
                allowEscapeKey: false,
                allowOutsideClick: false
            }).then(() => history.back())
        }
        console.log("로그인에 성공함!")
    })

    socket.on("login-fail", (args) => {
        if (args == "incorrect") {
            socketLogin(true)
        } else {
            Swal.fire({
                icon: "error",
                title: "로그인 실패",
                text: "서버에서 알 수 없는 오류가 발생했습니다.",
                allowOutsideClick: false,
                allowEscapeKey: false,
                confirmButtonText: "새로고침"
            }).then(() => window.location.reload())
        }
        console.error("로그인에 실패함. 사유: ", args)
    })

    socket.on("join-shop-ok", () => {
        // 상점 진입 성공
        console.log("상점 진입에 성공함!")

        Swal.fire({
            icon: "success",
            toast: true,
            title: "로그인 성공",
            text: "로그인에 성공하였습니다.",
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false,
            didOpen: (toast) => {
                toast.onmouseenter = Swal.stopTimer;
                toast.onmouseleave = Swal.resumeTimer;
            },
            position: "top-end"
        })
        // 상점 정보 받아오기
        socket.emit("get-menus")
    })

    socket.on("join-shop-fail", (args) => {
        // 상점 진입 실패
        console.error("상점 진입에 실패함. 사유: ", args)
        Swal.fire({
            icon: "error",
            title: "접근할 수 없음",
            text: "해당 상점에 접근할 수 있는 권한이 없거나 없는 상점입니다.",
            allowEscapeKey: false,
            allowOutsideClick: false,
            confirmButtonText: "뒤로가기"
        }).then(() => history.back())
    })

    socket.on("what-shop-in", (args) => {
        if (args != new URLSearchParams(window.location.search).get("store")) {
            console.log("연결된 상점이 일치하지 않습니다. 연결 절차를 다시 실행합니다.")
            socketLogin(false)
        } else {
            console.log("연결이 복구되었으며 연결된 상점이 일치합니다.")
            socket.emit("get-menus")
            Swal.fire({
                icon: "success",
                toast: true,
                title: "로그인 성공",
                text: "로그인에 성공하였습니다.",
                timer: 3000,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.onmouseenter = Swal.stopTimer;
                    toast.onmouseleave = Swal.resumeTimer;
                },
                position: "top-end"
            })
        }
    })

    socket.on("get-menu-result", (result) => {
        console.groupCollapsed("메뉴 정보 수신")
        console.log("수신된 메뉴 정보: ", result)
        menuList = result
        menuOnlyList = []
        result.forEach(element => {
            element.menus.forEach(element => menuOnlyList.push(element))
        });
        console.log("메뉴만 리스트: ", menuOnlyList)
        console.groupEnd()
        renderMenus(result, addMenuToOrder)
        updateDiscountPendingList()
        updateOrderPendingList()
        updateTotal()
        socket.emit("get-current-order")
    })

    socket.on("get-menu-fail", (res) => {
        Swal.fire({
            icon: "error",
            title: "메뉴를 불러올 수 없음",
            text: "메뉴를 불러올 수 없습니다.",
            allowEscapeKey: false,
            allowOutsideClick: false,
            confirmButtonText: "새로고침"
        }).then(() => window.location.reload())
    })

    socket.on("get-current-order-fail", () => {
        Swal.fire({
            icon: "error",
            title: "주문 내역 로드 실패",
            text: "서버 내부 오류입니다.",
            allowEscapeKey: false,
            allowOutsideClick: false,
            confirmButtonText: "새로고침"
        }).then(() => window.location.reload())
    })

    socket.on("current-order-result", (res) => {
        currentOrders = res
        updateOrders()
        console.groupEnd()
    })

    socket.on("order-ok", () => {
        deleteEverything()
        Swal.fire({
            icon: "success",
            title: "주문 완료",
            text: "주문을 접수했습니다."
        })
    })

    socket.on("order-fail", (arg) => {
        Swal.fire({
            icon: "error",
            title: "주문 실패",
            text: "내부 서버 오류입니다."
        })
    })

    socket.on("new-order", (arg) => {
        Swal.fire({
            toast: true,
            title: "새 주문",
            text: "새 주문이 접수되었습니다.",
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false,
            didOpen: (toast) => {
                toast.onmouseenter = Swal.stopTimer;
                toast.onmouseleave = Swal.resumeTimer;
            },
            position: "top-end"
        })
        currentOrders = arg
        updateOrders()
    })

    socket.on("menu-updated", () => {
        Swal.fire({
            icon: "warning",
            title: "메뉴 업데이트",
            text: "새로운 정보를 수신하기 위해 새로고침을 해야합니다.",
            allowEscapeKey: false,
            allowOutsideClick: false
        }).then(() => window.location.reload())
    })
    
    socket.on("update-menu-fail", () => {
        Swal.fire({
            icon: "warning",
            title: "메뉴 업데이트 실패",
            text: "메뉴 업데이트를 실패했습니다.",
            allowEscapeKey: false,
            allowOutsideClick: false
        })
    })
}

/**
 * 웹소켓 로그인
 * @param {Boolean} secondTry - 두번째 시도인가?
 */
async function socketLogin(secondTry) {
    // ID 수신
    let idResponse = await fetch("/api/username")
    let id = await idResponse.text()

    // 비밀번호 수신
    let pwResponse;
    if (secondTry) {
        pwResponse = await Swal.fire({
            title: "계속하려면 계정의 비밀번호를 입력하세요.",
            text: "[잘못된 비밀번호] 서버와 Socket.IO 통신을 시작하려면 비밀번호가 필요합니다.",
            input: "password",
            confirmButtonText: "계속하기",
            allowOutsideClick: false,
            allowEscapeKey: false
        })
    } else {
        pwResponse = await Swal.fire({
            title: "계속하려면 계정의 비밀번호를 입력하세요.",
            text: "서버와 Socket.IO 통신을 시작하려면 비밀번호가 필요합니다.",
            input: "password",
            confirmButtonText: "계속하기",
            allowOutsideClick: false,
            allowEscapeKey: false
        })
    }
    
    let pw = pwResponse.value
    //console.log("소켓 로그인 요청 보내기 / ID: ", id, " / Password: ", pw)
    socket.emit("login-request", {id: id, password: pw})
}

//#region 메뉴 등록 / 삭제

/**
 * 메뉴 선택 버튼이 클릭되면 실행된다.
 * @param {PointerEvent} e - 클릭 이벤트 
 * @todo 실질적인 기능 만들기
 */
function addMenuToOrder(e) {
    let code = e.currentTarget.dataset.posMenucode
    let menuItem = menuOnlyList.find(function (element) {
        return element.menuCode == code
    })

    if (menuItem == undefined) {
        // NO DATA
        Swal.fire({
            icon: "warning",
            title: "등록되지 않은 메뉴",
            text: "해당 메뉴는 등록되지 않았습니다."
        })
    } else if (menuItem.discount) {
        // 할인임
        discountPendingList.push({menuCode: code})
        updateDiscountPendingList()
    } else {
        // 메뉴임
        let index = orderPendingList.findIndex(function (element) {
            return element.menuCode == code
        })
    
        if (index == -1) {
            // 새로 추가
            orderPendingList.push({menuCode: code, count: 1})
        } else {
            orderPendingList[index].count++
        }
    
        updateOrderPendingList()
    }

    updateTotal()
}

function updateOrderPendingList() {
    let orderPendingEl = document.getElementById("order-pending")
    orderPendingEl.replaceChildren()
    orderPendingList.forEach((element, index) => {
        let El = document.createElement("a")
        El.href = "#"
        El.classList.add("list-group-item", "list-group-item-action", "d-flex", "justify-content-between", "order-pending-child")
        El.dataset.posOrderIndex = index
        let innerText1 = document.createElement("div")
        let innerText2 = document.createElement("div")
        menuOnlyList.forEach(element2 => {
            if (element2.menuCode == element.menuCode) {
                innerText1.textContent = element2.menuName
                innerText2.textContent = element.count  + "개 / " + (element.count * element2.price) + "원"
            }
        });

        if (index == pendingSelected) {
            El.classList.add("active")
        }

        El.addEventListener("click", orderPendingListClick)
        El.appendChild(innerText1)
        El.appendChild(innerText2)
        orderPendingEl.appendChild(El)
    })
}

function updateDiscountPendingList() {
    let discountPendingEl = document.getElementById("discount-pending")
    discountPendingEl.replaceChildren()
    discountPendingList.forEach((element, index) => {
        let El = document.createElement("a")
        El.href = "#"
        El.classList.add("list-group-item", "list-group-item-action", "d-flex", "justify-content-between", "discount-pending-child")
        El.dataset.posDiscountIndex = index
        let innerText1 = document.createElement("div")
        let innerText2 = document.createElement("div")
        menuOnlyList.forEach(element2 => {
            if (element2.menuCode == element.menuCode) {
                innerText1.textContent = element2.menuName
                innerText2.textContent = element2.price + "원"
            }
        })

        if (index == discountSelected) {
            El.classList.add("active")
        }

        El.addEventListener("click", discountPendingListClick)
        El.appendChild(innerText1)
        El.appendChild(innerText2)
        discountPendingEl.appendChild(El)
    })
}

/**
 * 주문 입력 창의 목록 속 클릭
 * @param {PointerEvent} e - 클릭 이벤트
 */
function orderPendingListClick(e) {
    document.querySelectorAll(".order-pending-child").forEach((element) => element.classList.remove("active"))
    e.currentTarget.classList.add("active")
    pendingSelected = parseInt(e.currentTarget.dataset.posOrderIndex)
}

/**
 * 할인 입력 창의 목록 속 클릭
 * @param {PointerEvent} e - 클릭 이벤트
 */
function discountPendingListClick(e) {
    document.querySelectorAll(".discount-pending.child").forEach(element => element.classList.remove("active"))
    e.currentTarget.classList.add("active")
    discountSelected = parseInt(e.currentTarget.dataset.posDiscountIndex)
}

/**
 * 모든 입력된 메뉴를 삭제
 */
function deleteEverything() {
    orderPendingList = []
    updateOrderPendingList()
    discountPendingList = []
    updateDiscountPendingList()
    updateTotal()
}

function deleteEverythingPop() {
    Swal.fire({
        icon: "warning",
        title: "모두 삭제",
        text: "입력한 모든 메뉴를 삭제합니다. 계속하시겠습니까?",
        showCancelButton: true,
        confirmButtonText: "삭제",
        confirmButtonColor: "#d33",
        cancelButtonText: "취소"
    }).then((result) => {
        if (result.isConfirmed) {
            deleteEverything()
        }
    })
}

/**
 * 선택한 입력된 메뉴를 삭제
 */
function deleteSelectedPending() {
    if (pendingSelected != null) {
        orderPendingList.splice(pendingSelected, 1)
        if (orderPendingList[pendingSelected] == undefined) {
            pendingSelected = null
        }
        updateOrderPendingList()
    }
    updateTotal()
}

function deletePendingDiscount() {
    if (discountSelected != null) {
        discountPendingList.splice(discountSelected, 1)
        if (discountPendingList[discountSelected] == undefined) {
            discountSelected = null
        }
        updateDiscountPendingList()
    }
    updateTotal()
}

/**
 * 선택된 입력된 메뉴의 수량을 count로 수정
 * @param {number} count - 새 수량
 */
function modCount(count) {
    orderPendingList[pendingSelected].count = count
    updateOrderPendingList()
    updateTotal()
}

/**
 * 선택된 입력된 메뉴의 수량을 바꾸는 창 표시
 */
function modCountPop() {
    //TODO
    if (pendingSelected == null) {
        Swal.fire({
            icon: "warning",
            title: "먼저 상품을 선택하세요",
            text: "수량을 변경할 상품을 선택하세요."
        })
    } else {
        Swal.fire({
            title: "수량 변경",
            input: "number"
        }).then((result) => {
            if (parseInt(result.value) > 0) {
                modCount(result.value)
            } else if (parseInt(result.value) == 0) {
                deleteSelectedPending()
            } else {
                Swal.fire({
                    title: "잘못된 수량",
                    icon: "warning",
                    text: "수량은 음수일 수 없습니다."
                })
            }
        })
    }
}

function updateTotal() {
    let totalSum = 0
    orderPendingList.forEach((element) => {
        let price = menuOnlyList.find(function (el) {
            return el.menuCode == element.menuCode
        }).price
        totalSum += price * element.count
    })

    let totalDiscount = 0
    discountPendingList.forEach(element => {
        let price = menuOnlyList.find(function (el) {
            return el.menuCode == element.menuCode
        }).price
        totalDiscount += price
    })

    let finalTotal = totalSum - totalDiscount

    document.getElementById("total-sum").textContent = totalSum + "원"
    document.getElementById("total-discount").textContent = totalDiscount + "원"
    document.getElementById("total-payment").textContent = finalTotal + "원"
}

//#endregion

async function orderNow() {
    if (orderPendingList.length == 0) {
        Swal.fire({
            icon: "warning",
            title: "메뉴 없음",
            text: "입력된 메뉴가 없습니다."
        })
    } else {
        let confirmed = await Swal.fire({
            icon: "question",
            title: "주문하기",
            text: "정말로 주문하시겠습니까?",
            showCancelButton: true,
            confirmButtonText: "주문하기",
            cancelButtonText: "취소"
        })
        if (confirmed.isConfirmed) {
            let name = await Swal.fire({
                title: "주문자 이름",
                text: "주문자 이름을 입력해주시기 바랍니다.",
                input: "text",
                showCancelButton: true,
                cancelButtonText: "취소"
            })
            if (name.isConfirmed) {
                let totalSum = 0
                orderPendingList.forEach((element) => {
                    let price = menuOnlyList.find(function (el) {
                        return el.menuCode == element.menuCode
                    }).price
                    totalSum += price * element.count
                })
        
                let totalDiscount = 0
                discountPendingList.forEach(element => {
                    let price = menuOnlyList.find(function (el) {
                        return el.menuCode == element.menuCode
                    }).price
                    totalDiscount += price
                })
        
                let finalTotal = totalSum - totalDiscount
        
                let data = {
                    visitor: name.value,
                    menuList: menuOnlyList,
                    orderedMenu: orderPendingList,
                    discounts: discountPendingList,
                    totalSum: totalSum,
                    totalDiscount: totalDiscount,
                    finalTotal: finalTotal
                }
        
                socket.emit("order", data)
            }
        }
    }
}

function updateOrders() {
    let dividedArray = divideArray(currentOrders, 3)
    let display = document.getElementById("ordered-display")
    display.replaceChildren()
    dividedArray.forEach((element) => {
        let row = document.createElement("div")
        row.classList.add("row", "g-3", "m-1")
        element.forEach(element2 => {
            let cardContainer = document.createElement("div")
            cardContainer.classList.add("col-md-3", "m-1")
            let card = document.createElement("div")
            card.classList.add("card")
            let cardBody = document.createElement("div")
            cardBody.classList.add("card-body")
            let cardHeader = document.createElement("h5")
            cardHeader.textContent = element2.orderdata.visitor
            let cardText = document.createElement("div")
            let cardTextList = document.createElement("ul")
            element2.orderdata.orderedMenu.forEach((element3) => {
                let cardTextListItem = document.createElement("li")
                cardTextListItem.textContent = (menuOnlyList.find((arg) => arg.menuCode == element3.menuCode).menuName) + " × " + element3.count
                cardTextList.appendChild(cardTextListItem)
            })
            let cardButtonDiv = document.createElement("div")
            cardButtonDiv.classList.add("d-flex")
            let completeBtn = document.createElement("button")
            completeBtn.classList.add("btn", "btn-primary", "m-1")
            completeBtn.dataset.posOrderid = element2.id
            completeBtn.textContent = "조리 완료"
            completeBtn.addEventListener("click", cookComplete)
            let refundBtn = document.createElement("button")
            refundBtn.classList.add("btn", "btn-warning", "m-1")
            refundBtn.dataset.posOrderid = element2.id
            refundBtn.textContent = "환불"
            refundBtn.addEventListener("click", refundRequest)
            cardButtonDiv.appendChild(completeBtn)
            cardButtonDiv.appendChild(refundBtn)
            cardText.appendChild(cardTextList)
            cardBody.appendChild(cardHeader)
            cardBody.appendChild(cardText)
            cardBody.appendChild(cardButtonDiv)
            card.appendChild(cardBody)
            cardContainer.appendChild(card)
            row.appendChild(cardContainer)
        })
        display.appendChild(row)
    })
}

/**
 * 메뉴 선택을 할 수 있는 화면을 메뉴 정보를 받아 그린다.
 * @param {object} data - 메뉴 정보를 받는다
 * @param {void} funcToRunWhenClicked - 메뉴 버튼이 클릭되었을때 실행할 함수이다. 해당 함수는 클릭 이벤트 정보를 파라미터로 받는다.
 */
function renderMenus(data, funcToRunWhenClicked) {
    console.groupCollapsed("메뉴 선택 화면 그리기")
    console.log("다음 항목으로 메뉴를 그립니다: ", data)
    // Draw tabs
    document.getElementById("menu-choose-display").replaceChildren()
    let menuChooseHeader = document.createElement("h3")
    menuChooseHeader.textContent = "메뉴 입력"
    document.getElementById("menu-choose-display").appendChild(menuChooseHeader)
    let tabList = document.createElement("ul")
    tabList.classList.add("nav", "nav-tabs")
    tabList.id = "menuTab"
    tabList.role = "tablist"
    data.forEach((element, index) => {
        let tabInnerList = document.createElement("li")
        let tabInnerButton = document.createElement("button")
        tabInnerList.classList.add("nav-item")
        tabInnerList.role = "presentation"
        tabInnerButton.id = `tab-${index}`
        tabInnerButton.dataset.bsToggle = "tab"
        tabInnerButton.dataset.bsTarget = `#tab-${index}-pane`
        tabInnerButton.type = "button"
        tabInnerButton.role = "tab"
        tabInnerButton.ariaControls = `tab-${index}-pane`
        tabInnerButton.classList.add("nav-link")
        tabInnerButton.textContent = element.sectionName
        tabInnerList.appendChild(tabInnerButton)
        tabList.appendChild(tabInnerList)
        if (index == 0) {
            tabInnerButton.classList.add("active")
            tabInnerButton.ariaSelected = true
        }
    })
    document.getElementById("menu-choose-display").appendChild(tabList)
    console.log("탭 그리기: ", tabList)
    // Draw pane
    let menuTabContent = document.createElement("div")
    menuTabContent.classList.add("tab-content")
    menuTabContent.id = "menuTabContent"
    console.log("탭 Pane을 그렸습니다.")
    data.forEach((element, index) => {
        const dividedArray = divideArray(element.menus, 3)
        console.log("하위 탭 그리기: ", element.menus)
        let tabPane = document.createElement("div")
        tabPane.classList.add("tab-pane", "fade")
        tabPane.id = `tab-${index}-pane`
        tabPane.role = "tabpanel"
        tabPane.ariaLabelledBy = `tab-${index}`
        tabPane.tabIndex = 0
        if (index == 0) {
            tabPane.classList.add("show", "active")
        }
        console.log("하위 탭 Pane의 요소를 만들었습니다: ", tabPane)
        console.log("하위 탭 내용의 Array를 나눴습니다. ", dividedArray)
        dividedArray.forEach((element2, index2) => {
            console.log("메뉴 한줄 그리기 / 다음 메뉴로 그림: ", element2)
            let menuRow = document.createElement("div")
            menuRow.classList.add("row", "g-3", "mb-3")
            menuRow.id = `tab-${index}-pane-${index2}`
            element2.forEach((element3 ,index3) => {
                // 각 버튼이 눌렀을 때 특정 코드를 실행하도록 할 필요가 있음.
                let menuBtnCont = document.createElement("div")
                menuBtnCont.classList.add("col-sm-3")
                let menuBtn = document.createElement("button")
                menuBtn.classList.add("menu-button")
                let menuBtnInsideText1 = document.createElement("div")
                menuBtnInsideText1.textContent = element3.menuName
                let menuBtnInsideText2 = document.createElement("small")
                menuBtnInsideText2.textContent = element3.price + "원"
                menuBtn.appendChild(menuBtnInsideText1)
                menuBtn.appendChild(menuBtnInsideText2)
                menuBtn.id = `menu-add-btn-tab-${index}-pane-${index2}-${index3}`
                menuBtn.dataset.posMenucode = element3.menuCode
                menuBtn.addEventListener("click", funcToRunWhenClicked)

                menuBtnCont.appendChild(menuBtn)
                menuRow.appendChild(menuBtnCont)
            })
            tabPane.appendChild(menuRow)
        })
        menuTabContent.append(tabPane)
    })
    document.getElementById("menu-choose-display").appendChild(menuTabContent)
    console.groupEnd()
}

/**
 * Array를 특정한 개수씩 나눈다.
 * @param {any[]} array - 나눌 Array
 * @param {number} count - 개수
 * @returns {any[][]} - 생성된 새로운 Array
 */
function divideArray(array, count) {
    const length = array.length
    const divide = Math.floor(length / count) + (Math.floor(length%count) > 0 ? 1 : 0)
    const newArray = []

    for (let i = 0; i < divide; i++) {
        newArray.push(array.splice(0, count))
    }

    return newArray
}

/**
 * 조리 완료
 * @param {PointerEvent} e 
 */
function cookComplete(e) {
    socket.emit("cook-complete", e.currentTarget.dataset.posOrderid)
}

/**
 * 환불 처리
 * @param {PointerEvent} e 
 */
function refundRequest(e) {
    socket.emit("refund-request", e.currentTarget.dataset.posOrderid)
}

function updateMenus() {
    Swal.fire({
        title: "새 메뉴 파일 업로드",
        text: "형식에 맞춰 쓰여져야 합니다. 그렇지 않으면 로딩중 오류가 발생할 수 있습니다.",
        input: "file",
        inputAttributes: {
            "accept": ".json",
            "aria-label": "새 메뉴 파일 업로드"
        },
        showCancelButton: true
    }).then((result) => {
        if (result.isConfirmed) {
            let reader = new FileReader()
            console.log(result.value)
            reader.onload = function (e) {
                try {
                    let newData = JSON.parse(e.target.result)
                    socket.emit("update-menu", newData)
                } catch (error) {
                    Swal.fire({
                        icon: "warning",
                        title: "JSON이 아님",
                        text: "이 파일은 JSON이 아닙니다."
                    })
                }
            }
            reader.readAsText(result.value, "utf8")
        }
    })
}

document.getElementById("delete-selected-pending-btn").addEventListener("click", deleteSelectedPending)
document.getElementById("delete-all-pending-btn").addEventListener("click", deleteEverythingPop)
document.getElementById("change-selected-pending-count").addEventListener("click", modCountPop)
document.getElementById("delete-selected-discount-btn").addEventListener("click", deletePendingDiscount)
document.getElementById("order-now-btn").addEventListener("click", orderNow)
document.getElementById("mod-orderable-menu-btn").addEventListener("click", updateMenus)