// CommunityList.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchCommunities, fetchTopViewed, fetchTopCommented } from '../../api/communityApi.js';
import { getUserInfo } from '../../api/userAPI.js';
import PageComponent from '../../common/pageComponent.jsx';
import CommunityLayout from '../../layout/CommunityLayout/CommunityLayout.jsx';
import LeftSidebar from '../../layout/CommunityLayout/LeftSidebar.jsx';
import RightSidebar from '../../layout/CommunityLayout/RightSidebar.jsx';
import useAuthStore from '../../stores/authStore.js';

const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);
    if (diffSeconds < 60) {
        return `${diffSeconds}초 전`;
    } else if (diffSeconds < 3600) {
        const minutes = Math.floor(diffSeconds / 60);
        return `${minutes}분 전`;
    } else if (diffSeconds < 86400) {
        const hours = Math.floor(diffSeconds / 3600);
        return `${hours}시간 전`;
    } else {
        const days = Math.floor(diffSeconds / 86400);
        return `${days}일 전`;
    }
};

const CommunityList = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialCategory = searchParams.get('category') || '전체';
    const currentUser = useAuthStore((state) => state.user);
    const currentUserId = currentUser?._id;

    const [pageResponse, setPageResponse] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    const [filteredCommunities, setFilteredCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [selectedSort, setSelectedSort] = useState('최신순');
    const [userMap, setUserMap] = useState({});

    const [topViewed, setTopViewed] = useState([]);
    const [topCommented, setTopCommented] = useState([]);
    const [sideTab, setSideTab] = useState('viewed');

    const [keyword, setKeyword] = useState('');
    const [searchType, setSearchType] = useState('title+content');

    const loadCommunities = async (page) => {
        setLoading(true);
        try {
            const data = await fetchCommunities(
                page,
                pageSize,
                selectedCategory,
                (selectedCategory === '내 글' || selectedCategory === '내 댓글') ? currentUserId : null,
                selectedSort,
                keyword,
                searchType      // 검색 타입 함께 전달
            );
            setPageResponse(data);
            setFilteredCommunities(data.dtoList || []);
        } catch (err) {
            setError('커뮤니티 목록을 불러오는 데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 검색 실행 핸들러
    const handleSearch = () => {
        setCurrentPage(1);
        loadCommunities(1);
    };


    useEffect(() => {
        const fetchGlobalTop = async () => {
            try {
                const topViewedData = await fetchTopViewed();
                setTopViewed(topViewedData);
            } catch (error) {
                console.error('최다 조회 데이터를 불러오지 못했습니다.', error);
                setTopViewed([]);
            }
            try {
                const topCommentedData = await fetchTopCommented();
                setTopCommented(topCommentedData);
            } catch (error) {
                console.error('최다 댓글 데이터를 불러오지 못했습니다.', error);
                setTopCommented([]);
            }
        };
        fetchGlobalTop();
    }, []);

    // 현재 사용자가 필요한 카테고리일 때 userId가 로드되지 않았다면 호출하지 않음
    useEffect(() => {
        if ((selectedCategory === '내 글' || selectedCategory === '내 댓글') && !currentUserId) {
            return;
        }
        loadCommunities(currentPage);
    }, [currentPage, selectedCategory, selectedSort, currentUserId]);

    useEffect(() => {
        const fetchUserNames = async () => {
            if (!pageResponse || !pageResponse.dtoList) return;
            const userIds = new Set();
            pageResponse.dtoList.forEach((comm) => {
                userIds.add(comm.userId);
            });
            const newUserMap = {};
            const promises = Array.from(userIds).map(async (uid) => {
                try {
                    const userInfo = await getUserInfo(uid);
                    newUserMap[uid] = userInfo.nickname || userInfo.name || uid;
                } catch (err) {
                    newUserMap[uid] = uid;
                    console.error(err);
                }
            });
            await Promise.all(promises);
            setUserMap(newUserMap);
        };
        fetchUserNames();
    }, [pageResponse]);

    const handleCategoryClick = (category) => {
        setSelectedCategory(category);
        setCurrentPage(1);
        navigate(`?category=${category}`);
    };

    const handleSortChange = (sortOption) => {
        setSelectedSort(sortOption);
    };

    const changePage = (page) => {
        setCurrentPage(page);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                로딩중...
            </div>
        );
    }
    if (error) {
        return <div className="text-red-500 text-center mt-4">{error}</div>;
    }

    return (
        <CommunityLayout
            leftSidebar={<LeftSidebar selectedCategory={selectedCategory} handleCategoryClick={handleCategoryClick} />}
            rightSidebar={<RightSidebar sideTab={sideTab} setSideTab={setSideTab} topViewed={topViewed} topCommented={topCommented} />}
        >
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">커뮤니티 목록 ({selectedCategory})</h1>
                    <div>
                        {['최신순', '인기순'].map((option) => (
                            <button
                                key={option}
                                onClick={() => handleSortChange(option)}
                                className={`ml-2 px-3 py-2 rounded ${selectedSort === option ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
                {/* ── 검색폼 ── */}
                <div className="flex items-center mb-4 space-x-2">
                    <select
                        value={searchType}
                        onChange={e => setSearchType(e.target.value)}
                        className="border rounded px-3 py-1 bg-white"
                    >
                        <option value="title">제목</option>
                        <option value="content">내용</option>
                        <option value="title+content">제목+내용</option>
                        <option value="author">작성자</option>
                    </select>

                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={keyword}
                            onChange={e => setKeyword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            placeholder="검색어 입력"
                            className="w-full border rounded-full py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <button
                            onClick={handleSearch}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                            {/* Heroicon 검색 아이콘 */}
                            <svg xmlns="http://www.w3.org/2000/svg"
                                 className="h-5 w-5"
                                 fill="none"
                                 viewBox="0 0 24 24"
                                 stroke="currentColor"
                            >
                                <path strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 16l4-4m0 0l4-4m-4 4H3m13 4h5m-5-8h5" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="mt-6">
                    <button
                        onClick={() => navigate('/community/new')}
                        className="inline-block bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-200"
                    >
                        새 게시글 작성
                    </button>
                </div>
                <br/>
                {filteredCommunities.length === 0 ? (
                    <p className="text-gray-600">게시글이 없습니다.</p>
                ) : (
                    <ul className="space-y-4">
                        {filteredCommunities.map((community) => (
                            <li
                                key={community._id}
                                className="border border-gray-200 p-4 rounded shadow-sm hover:shadow-md transition duration-200 flex"
                            >
                                {community.communityImage && (
                                    <div className="w-20 h-20 mr-4 flex-shrink-0">
                                        <img
                                            src={community.communityImage.startsWith('http') || community.communityImage.startsWith('data:')
                                                ? community.communityImage
                                                : `${import.meta.env.VITE_API_HOST}${community.communityImage}`}
                                            alt="게시글 이미지"
                                            className="w-full h-full object-cover rounded"
                                        />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <button
                                        onClick={() => navigate(`/community/${community._id}`)}
                                        className="text-blue-500 font-medium hover:underline"
                                    >
                                        {community.communityTitle} ({community.communityCategory})
                                    </button>
                                    <p className="mt-2 text-sm text-gray-600">
                                        작성일:{' '}
                                        <span className="font-semibold">{formatRelativeTime(community.communityRegDate)}</span>{' '}
                                        | 조회수:{' '}
                                        <span className="font-semibold">{community.communityViews}</span>{' '}
                                        | 추천:{' '}
                                        <span className="font-semibold">{community.recommended}</span>{' '}
                                        | 댓글:{' '}
                                        <span className="font-semibold">
                                            {community.commentCount || (community.comments ? community.comments.length : 0)}
                                        </span>
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        작성자:{' '}
                                        <span className="font-semibold">{userMap[community.userId] || community.userId}</span>
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
                {pageResponse && (
                    <PageComponent pageResponse={pageResponse} changePage={changePage}/>
                )}
            </div>
        </CommunityLayout>
    );
};

export default CommunityList;
