import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserInfo } from "../../api/userAPI"; // 유저 정보 호출 API
import { createChatRoom, joinChatRoom, fetchChatRooms } from "../../api/chatAPI";
import LoadingComponent from "../../common/LoadingComponent.jsx"; // 로딩 컴포넌트 import

const RandomChatComponent = () => {
    const [capacity, setCapacity] = useState("");
    const [matchedGender, setMatchedGender] = useState("any"); // 성별 매칭 상태
    const [userInfo, setUserInfo] = useState(null); // 유저 정보 상태
    const [loading, setLoading] = useState(true); // 로딩 상태
    const [error, setError] = useState(null); // 에러 상태
    const navigate = useNavigate();
    const userId = "67bea7c29118c00aca0d5f1b"; // 실제로 로그인된 사용자 ID로 설정

    // 유저 정보 호출 함수
    const fetchUserInfo = async (userId) => {
        try {
            const data = await getUserInfo(userId); // getUserInfo API 호출
            setUserInfo(data); // 유저 정보 상태에 저장
            setLoading(false); // 로딩 완료
        } catch (err) {
            setError(err.message); // 에러 발생 시 에러 상태 업데이트
            setLoading(false); // 로딩 완료
        }
    };

    useEffect(() => {
        fetchUserInfo(userId); // 컴포넌트 마운트 시 유저 정보 호출
    }, [userId]);

    // 랜덤 채팅방 찾기 및 생성 함수
    const findOrCreateRandomRoom = async (userId, capacity, matchedGender) => {
        setLoading(true); // 로딩 시작
        try {
            if (capacity < 2 || capacity > 5) {
                alert("참여 인원은 2~5명 사이로 입력해주세요.");
                setLoading(false);
                return;
            }

            if (!userInfo) {
                alert("유저 정보를 불러오는 중입니다.");
                setLoading(false);
                return;
            }

            // 현재 존재하는 랜덤 채팅방 중에서 조건에 맞는 채팅방 찾기
            const rooms = await fetchChatRooms();
            console.log("현재 채팅방 목록:", rooms);

            const availableRooms = rooms.filter((room) => {

                // 채팅방 필터링 조건
                // 랜덤 채팅방이 아닌 경우 제외
                if (room.roomType !== "random") return false;
                // 설정한 인원(capacity)과 다른 경우 제외
                if (room.capacity !== capacity) return false;
                // 이미 정원이 다 찬 방은 제외
                if (room.chatUsers.length >= room.capacity) return false;
                // 활성화된(isActive === true) 채팅방이거나, 대기 중(waiting) 상태가 아닌 경우 제외
                if (room.isActive || room.status !== "waiting") return false;

                // 참가자의 성별과 매칭 조건 비교
                // "same"일 때 동성 매칭
                if (matchedGender === "same") {
                    return room.matchedGender === "same" &&
                        room.chatUsers.every(user => user.gender === userInfo.gender);
                }
                // "opposite"일 때 이성 매칭
                if (matchedGender === "opposite") {
                    return room.matchedGender === "opposite" &&
                        room.chatUsers.every(user => user.gender !== userInfo.gender);
                }
                // "any"일 때 "any" 조건인 방만 허용
                if (matchedGender === "any") {
                    return room.matchedGender === "any";
                }

                return false;
            });

            let room;

            // 사용자가 이미 참여한 채팅방이 있으면 해당 채팅방으로 이동
            const existingRoom = rooms.find(
                (room) =>
                    room.roomType === "random" &&
                    room.chatUsers.some(user => user._id === userId)
            );

            if (existingRoom) {
                alert(`이미 참여한 랜덤 채팅방에 참가하고 있습니다.`);
                setLoading(false);
                navigate(`/chat/${existingRoom._id}/${userId}`);
                return;
            }

            // 정원이 다 차지 않은 랜덤 채팅방이 있으면 랜덤으로 배정
            if (availableRooms.length > 0) {
                room = availableRooms[Math.floor(Math.random() * availableRooms.length)];
                alert(`랜덤 채팅방(${capacity}명, ${matchedGender} 매칭)에 참가했습니다.`);
            } else {
                // 없으면 새로운 랜덤 채팅방 생성
                room = await createChatRoom("random", capacity, matchedGender);
                alert(`새로운 랜덤 채팅방(${capacity}명, ${matchedGender} 매칭)을 생성했습니다.`);
            }

            // 채팅방 참가 요청
            await joinChatRoom(room._id, userId);
            console.log("채팅방에 참가했습니다.");

            // 채팅방으로 이동
            navigate(`/chat/${room._id}/${userId}`);
        } catch (error) {
            console.error("랜덤 채팅방 참가에 실패:", error);
            alert("랜덤 채팅방 참가에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };


    // 로딩 중 또는 에러 발생 시 처리
    if (loading) {
        return <LoadingComponent message="대기 중입니다... 채팅방을 찾고 있습니다." />; // 로딩 상태일 때 로딩 컴포넌트 표시
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h2 className="text-2xl font-semibold mb-4">랜덤 채팅 시작</h2>

            {/* 유저 정보 출력 */}
            <div className="mb-4">
                <h3>유저 정보</h3>
                <p>이름: {userInfo.name}</p>
                <p>닉네임: {userInfo.nickname}</p>
                <p>성별: {userInfo.gender}</p>
                <p>전화번호: {userInfo.phone}</p>
            </div>

            {/* 랜덤 채팅방 참가 폼 */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="참여 인원 (2~5명)"
                    value={capacity}
                    onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        if (!isNaN(value) && value >= 2 && value <= 5) {
                            setCapacity(value);
                        } else {
                            setCapacity("");
                        }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="mb-4">
                <select
                    value={matchedGender}
                    onChange={(e) => setMatchedGender(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="any">상관없음</option>
                    <option value="opposite">이성</option>
                    <option value="same">동성</option>
                </select>
            </div>

            <button
                onClick={() => findOrCreateRandomRoom(userId, capacity, matchedGender)}
                className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg shadow-md hover:bg-purple-600 focus:outline-none"
            >
                랜덤 채팅 시작
            </button>
        </div>
    );
};

export default RandomChatComponent;
