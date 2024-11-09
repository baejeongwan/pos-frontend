/**
 * POS 시스템의 구동의 핵심 모듈
 * @module main
 * @author Bae Jeongwan <jayden.bae@outlook.kr>
 * @version 1.0.0
 * @license GPL
 */
import { renderMenus } from "./render-from-data.js"
import { io } from "socket.io-client"
import Swal from "sweetalert2"

const socket = io()

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

    socketIOControl()
}

function socketIOControl() {
    socket.on("connect", () => {
        console.log("Socket.IO 통신이 연결되었습니다!")
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

    socket.on("login-ok", () => {
        Swal.fire({
            icon: "success",
            title: "서버 접속 성공",
            text: "서버에 접속했으며 로그인에 성공했습니다."
        })

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
        }
    })

    socket.on("get-menu-result", (result) => {
        console.groupCollapsed("메뉴 정보 수신")
        console.log("수신된 메뉴 정보: ", result)
        let menuOnlyList = []
        result.forEach(element => {
            element.menus.forEach(element => menuOnlyList.push(element))
        });
        console.log("메뉴만 리스트: ", menuOnlyList)
        console.groupEnd()
        renderMenus(result, addMenuToOrder)
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

/**
 * 메뉴 선택 버튼이 클릭되면 실행된다.
 * @param {PointerEvent} e - 클릭 이벤트 
 * @todo 실질적인 기능 만들기
 */
function addMenuToOrder(e) {
    console.log(e, e.target.dataset.posMenucode)
}