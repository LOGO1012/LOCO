// src/routers/DeveloperRouter.jsx
import DeveloperPage from "../pages/DeveloperPage/DeveloperPage.jsx";
//접근제한
import LoadingComponent from '../common/LoadingComponent.jsx'
import { Navigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore.js';

function DeveloperGuard() {
    // const user = useAuthStore(state => state.user);
    const user      = useAuthStore(state => state.user);
    const isLoading = useAuthStore(state => state.isLoading);
    if (isLoading) {
        return <LoadingComponent message="로딩 중..." />;
    }
    // 아직 로딩 중이거나 인증되지 않은 경우 (원한다면 로더/로그인 리다이렉트 처리)
    if (!user) {
        return <Navigate to="/loginPage" replace />;
    }
    // 레벨 체크
    if (user.userLv < 3) {
        return <Navigate to="/" replace />;
    }
    return <DeveloperPage />;
}

const DeveloperRouter = {
    path: "/developer",
    element: < DeveloperGuard  />
};

export default DeveloperRouter;
