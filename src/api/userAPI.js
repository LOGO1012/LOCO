// src/api/userAPI.js
import axios from "axios"; // axios 모듈 import

const host = `${import.meta.env.VITE_API_HOST}/api/user`;

// 유저 정보 조회 API 함수
export const getUserInfo = async (userId) => {
    try {
        const response = await axios.get(`${host}/${userId}`); // API 호출
        return response.data.data; // 성공적으로 데이터 받으면 반환
        // eslint-disable-next-line no-unused-vars
    } catch (error) {
        throw new Error("유저 정보를 불러오는 데 실패했습니다."); // 에러 발생 시 에러 메시지
    }
};

export const rateUser = async (userId, rating) => {
    try {
        const response = await axios.post(
            `${host}/${userId}/rate`,
            { rating },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("rateUser API 호출 중 오류:", error);
        // axios의 error 객체는 response를 포함할 수 있음
        if (error.response && error.response.data && error.response.data.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error("별점 업데이트 실패");
    }
};

// 별칭(nickname)으로 사용자 조회 API 함수
export const getUserByNickname = async (nickname) => {
    try {
        const response = await axios.get(`${host}/nickname/${encodeURIComponent(nickname)}`);
        console.log("API 응답 데이터:", response.data); // 응답 데이터 확인
        const data = response.data.data;
        if (!data) {
            throw new Error("응답 데이터에 user 정보가 없습니다.");
        }
        // 만약 data가 배열이면 첫 번째 요소 반환, 아니면 그대로 반환
        if (Array.isArray(data)) {
            if (data.length === 0) {
                throw new Error("해당 별칭을 가진 사용자를 찾을 수 없습니다.");
            }
            return data[0];
        } else {
            return data;
        }
        // eslint-disable-next-line no-unused-vars
    } catch (error) {
        throw new Error("유저 정보를 불러오는 데 실패했습니다.");
    }
};

export const decrementChatCount = async (userId) => {
    try {
        const response = await axios.post(
            `${host}/${userId}/decrementChatCount`,
            { userId },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("채팅 횟수 감소 중 오류 발생:", error);
        throw error;
    }
};
